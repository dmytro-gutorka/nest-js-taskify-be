# ABAC System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current resource-coupled ABAC implementation with a scalable, ORM-agnostic engine that works with any entity and is manageable from the admin API.

**Architecture:** A pure-TypeScript core (`AbacEngine`, `PolicyEvaluator`, `TemplateResolver`) that knows nothing about NestJS or Prisma, wrapped in a thin NestJS module that injects a `PrismaWhereBuilder` adapter. Resource-specific code (field names, Zod schemas) lives in each resource module, not in the ABAC core.

**Tech Stack:** NestJS, TypeScript, Prisma, Zod, Jest

**Design spec:** `docs/superpowers/specs/abac-design.md`

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `src/modules/abac/core/abac-core.constants.ts` | `DslOperator` and `LogicalOperator` const objects |
| `src/modules/abac/core/types.ts` | `DslNode`, `PolicyResult`, `IWhereBuilder`, `AbacContext` |
| `src/modules/abac/core/template-resolver.ts` | Resolves `$$user.id` templates in DslNode trees |
| `src/modules/abac/core/template-resolver.spec.ts` | Tests for TemplateResolver |
| `src/modules/abac/core/abac-core.policy-evaluator.ts` | Converts `RolePermissionRule[]` → `PolicyResult` |
| `src/modules/abac/core/policy-evaluator.spec.ts` | Tests for PolicyEvaluator |
| `src/modules/abac/core/abac-core.engine.ts` | Orchestrates evaluator + resolver |
| `src/modules/abac/core/abac-engine.spec.ts` | Tests for AbacEngine |
| `src/modules/abac/adapters/prisma-where-builder.ts` | Translates `PolicyResult` → Prisma WHERE |
| `src/modules/abac/adapters/prisma-where-builder.spec.ts` | Tests for PrismaWhereBuilder |
| `src/modules/rbac/dto/create-rule.dto.ts` | Zod schemas and types for rule CRUD DTOs |

### Modified files
| File | Change |
|---|---|
| `src/modules/abac/abac.module.ts` | Rewrite with `forRoot(options)` dynamic module |
| `src/modules/abac/abac.service.ts` | Rewrite as generic `buildWhereOrThrow` |
| `src/modules/abac/index.ts` | Update barrel exports |
| `src/modules/tasks/services/tasks.service.ts` | Use new `buildWhereOrThrow` signature |
| `src/infrastructure/database/prisma/seed.ts` | Update conditions to DSL format |

### Removed files (Task 11)
- `src/modules/abac/services/abac-task-access.service.ts`
- `src/modules/abac/services/abac-template-resolver.service.ts`
- `src/modules/abac/services/abac.service.ts` (replaced by root-level `abac.service.ts`)
- `src/modules/abac/abac.abac-core.constants.ts`
- `src/modules/abac/abac.types.ts`
- `src/modules/abac/abac.guards.ts`

---

## Task 1: Core constants

**What:** Создаём константные объекты для операторов DSL. Это runtime-значения — их можно использовать в коде вместо магических строк (`DslOperator.EQ` вместо `'eq'`). TypeScript-тип выводится автоматически через `typeof`.

**Files:**
- Create: `src/modules/abac/core/abac-core.constants.ts`

- [ ] **Step 1: Create constants file**

```ts
// src/modules/abac/core/abac-core.constants.ts

export const DslOperator = {
    EQ: 'eq',
    NEQ: 'neq',
    IN: 'in',
    NOT_IN: 'not_in',
    GT: 'gt',
    GTE: 'gte',
    LT: 'lt',
    LTE: 'lte',
    CONTAINS: 'contains',
} as const;

export type DslOperator = typeof DslOperator[keyof typeof DslOperator];

export const LogicalOperator = {
    AND: 'AND',
    OR: 'OR',
} as const;

export type LogicalOperator = typeof LogicalOperator[keyof typeof LogicalOperator];
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/modules/abac/core/abac-core.constants.ts
git commit -m "feat(abac): add DSL operator and logical operator constants"
```

---

## Task 2: Core types

**What:** Определяем все TypeScript-интерфейсы и типы для DSL-системы. Это compile-time только — в скомпилированный JS они не попадают. `DslNode` рекурсивен: `DslGroup` содержит `DslNode[]`, поэтому лист (`DslLeaf`) и группа (`DslGroup`) образуют дерево условий. `PolicyResult` — то что возвращает движок после оценки правил. `IWhereBuilder<T>` — интерфейс который реализует каждый ORM-адаптер.

**Files:**
- Create: `src/modules/abac/core/types.ts`

- [ ] **Step 1: Create types file**

```ts
// src/modules/abac/core/types.ts

import { DslOperator, LogicalOperator } from './constants.js';
import { ActiveUser } from '../../../common/types/common.types.js';

export type DslValue = string | number | boolean | null;

export interface DslLeaf<TField extends string = string> {
    field: TField;
    op: DslOperator;
    value: DslValue | DslValue[];
}

export interface DslGroup<TField extends string = string> {
    operator: LogicalOperator;
    conditions: DslNode<TField>[];
}

export type DslNode<TField extends string = string> = DslLeaf<TField> | DslGroup<TField>;

export interface AbacContext {
    user: ActiveUser;
}

export type PolicyResult =
    | { effect: 'deny' }
    | { effect: 'full_access'; denyConditions: DslNode[] }
    | { effect: 'conditional'; allowConditions: DslNode[]; denyConditions: DslNode[] };

export interface IWhereBuilder<T> {
    build(policy: PolicyResult): T | null;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/modules/abac/core/types.ts
git commit -m "feat(abac): add core DSL types and interfaces"
```

---

## Task 3: TemplateResolver

**What:** Рекурсивно обходит дерево `DslNode` и заменяет строки вида `$$user.id` реальными значениями из контекста. Это позволяет хранить в БД универсальные условия (`"$$user.id"`) вместо конкретных значений (`1`). Реестр шаблонов (`TEMPLATE_REGISTRY`) — просто объект `{ '$$user.id': 'user.id' }`, где значение — это dot-path в объект `AbacContext`.

**Files:**
- Create: `src/modules/abac/core/template-resolver.ts`
- Create: `src/modules/abac/core/template-resolver.spec.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/modules/abac/core/template-resolver.spec.ts

import { TemplateResolver } from './template-resolver.js';
import { DslNode } from './types.js';
import { DslOperator, LogicalOperator } from './constants.js';
import { AuthProvider } from '../../../infrastructure/database/prisma/generated/enums.js';

const mockUser = { id: 42, email: 'user@test.com', provider: AuthProvider.EMAIL };
const context = { user: mockUser };

describe('TemplateResolver', () => {
    let resolver: TemplateResolver;

    beforeEach(() => {
        resolver = new TemplateResolver();
    });

    it('resolves $$user.id in a leaf value', () => {
        const node: DslNode = { field: 'assigneeId', op: DslOperator.EQ, value: '$$user.id' };
        const result = resolver.resolve(node, context);
        expect(result).toEqual({ field: 'assigneeId', op: DslOperator.EQ, value: 42 });
    });

    it('resolves $$user.email in a leaf value', () => {
        const node: DslNode = { field: 'email', op: DslOperator.EQ, value: '$$user.email' };
        const result = resolver.resolve(node, context);
        expect(result).toEqual({ field: 'email', op: DslOperator.EQ, value: 'user@test.com' });
    });

    it('passes through non-template primitive values unchanged', () => {
        const node: DslNode = { field: 'status', op: DslOperator.EQ, value: 'active' };
        const result = resolver.resolve(node, context);
        expect(result).toEqual(node);
    });

    it('resolves templates inside an array value', () => {
        const node: DslNode = { field: 'assigneeId', op: DslOperator.IN, value: ['$$user.id', 99] };
        const result = resolver.resolve(node, context) as typeof node;
        expect((result as DslNode & { value: unknown[] }).value).toEqual([42, 99]);
    });

    it('resolves templates recursively inside a DslGroup', () => {
        const node: DslNode = {
            operator: LogicalOperator.OR,
            conditions: [
                { field: 'assigneeId', op: DslOperator.EQ, value: '$$user.id' },
                { field: 'status', op: DslOperator.EQ, value: 'active' },
            ],
        };
        const result = resolver.resolve(node, context) as typeof node;
        expect((result as DslNode & { conditions: DslNode[] }).conditions[0]).toEqual(
            { field: 'assigneeId', op: DslOperator.EQ, value: 42 },
        );
    });

    it('throws BadRequestException for unknown template', () => {
        const node: DslNode = { field: 'x', op: DslOperator.EQ, value: '$$unknown.field' };
        expect(() => resolver.resolve(node, context)).toThrow('Unknown ABAC template: $$unknown.field');
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest template-resolver --no-coverage
```

Expected: FAIL — `Cannot find module './template-resolver.js'`

- [ ] **Step 3: Implement TemplateResolver**

```ts
// src/modules/abac/core/template-resolver.ts

import { BadRequestException } from '@nestjs/common';
import { DslNode, DslValue, AbacContext } from './types.js';

const TEMPLATE_REGISTRY: Record<string, string> = {
    '$$user.id': 'user.id',
    '$$user.email': 'user.email',
};

export class TemplateResolver {
    resolve(node: DslNode, context: AbacContext): DslNode {
        return this.resolveNode(node, context);
    }

    private resolveNode(node: DslNode, context: AbacContext): DslNode {
        if ('field' in node) {
            return {
                ...node,
                value: this.resolveValue(node.value, context),
            };
        }

        return {
            ...node,
            conditions: node.conditions.map((child) => this.resolveNode(child, context)),
        };
    }

    private resolveValue(
        value: DslValue | DslValue[],
        context: AbacContext,
    ): DslValue | DslValue[] {
        if (Array.isArray(value)) {
            return value.map((item) => this.resolvePrimitive(item, context));
        }

        return this.resolvePrimitive(value, context);
    }

    private resolvePrimitive(value: DslValue, context: AbacContext): DslValue {
        if (typeof value !== 'string' || !value.startsWith('$$')) {
            return value;
        }

        const path = TEMPLATE_REGISTRY[value];

        if (!path) {
            throw new BadRequestException(`Unknown ABAC template: ${value}`);
        }

        return this.getByPath(context, path);
    }

    private getByPath(source: unknown, path: string): DslValue {
        const result = path.split('.').reduce<unknown>((current, key) => {
            if (current === null || typeof current !== 'object') return undefined;
            return (current as Record<string, unknown>)[key];
        }, source);

        if (
            typeof result === 'string' ||
            typeof result === 'number' ||
            typeof result === 'boolean' ||
            result === null
        ) {
            return result;
        }

        throw new BadRequestException(`ABAC template path is not resolvable: ${path}`);
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest template-resolver --no-coverage
```

Expected: PASS — 6 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/modules/abac/core/template-resolver.ts src/modules/abac/core/template-resolver.spec.ts
git commit -m "feat(abac): add TemplateResolver with tests"
```

---

## Task 4: PolicyEvaluator

**What:** Принимает `RolePermissionRule[]` из БД и применяет логику приоритетов из комментария в схеме. Возвращает `PolicyResult` — одно из трёх: `deny`, `full_access` (с опциональными deny-условиями), или `conditional` (с allow и deny условиями). Этот класс ничего не знает ни о шаблонах, ни об ORM — только о приоритете правил.

**Files:**
- Create: `src/modules/abac/core/abac-core.policy-evaluator.ts`
- Create: `src/modules/abac/core/policy-evaluator.spec.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/modules/abac/core/policy-evaluator.spec.ts

import { PolicyEvaluator } from './policy-evaluator.js';
import { PolicyResult } from './types.js';
import { DslOperator } from './constants.js';

const makeRule = (
    effect: 'ALLOW' | 'DENY',
    type: 'CONDITIONAL' | 'FULL_ACCESS',
    conditions: unknown = null,
) => ({ id: 1, rolePermissionId: 1, effect, type, conditions, createdAt: new Date(), updatedAt: new Date() });

const allowLeaf = { field: 'assigneeId', op: DslOperator.EQ, value: '$$user.id' };
const denyLeaf = { field: 'status', op: DslOperator.EQ, value: 'archived' };

describe('PolicyEvaluator', () => {
    let evaluator: PolicyEvaluator;

    beforeEach(() => {
        evaluator = new PolicyEvaluator();
    });

    it('returns deny when there are no rules', () => {
        const result = evaluator.evaluate([]);
        expect(result).toEqual({ effect: 'deny' });
    });

    it('returns deny when any rule is DENY + FULL_ACCESS', () => {
        const rules = [
            makeRule('ALLOW', 'FULL_ACCESS'),
            makeRule('DENY', 'FULL_ACCESS'),
        ];
        const result = evaluator.evaluate(rules);
        expect(result).toEqual({ effect: 'deny' });
    });

    it('returns full_access with empty denyConditions when ALLOW + FULL_ACCESS and no DENY rules', () => {
        const rules = [makeRule('ALLOW', 'FULL_ACCESS')];
        const result = evaluator.evaluate(rules);
        expect(result).toEqual({ effect: 'full_access', denyConditions: [] });
    });

    it('returns full_access with denyConditions when ALLOW + FULL_ACCESS and DENY + CONDITIONAL', () => {
        const rules = [
            makeRule('ALLOW', 'FULL_ACCESS'),
            makeRule('DENY', 'CONDITIONAL', denyLeaf),
        ];
        const result = evaluator.evaluate(rules) as Extract<PolicyResult, { effect: 'full_access' }>;
        expect(result.effect).toBe('full_access');
        expect(result.denyConditions).toEqual([denyLeaf]);
    });

    it('returns conditional with allowConditions when ALLOW + CONDITIONAL', () => {
        const rules = [makeRule('ALLOW', 'CONDITIONAL', allowLeaf)];
        const result = evaluator.evaluate(rules) as Extract<PolicyResult, { effect: 'conditional' }>;
        expect(result.effect).toBe('conditional');
        expect(result.allowConditions).toEqual([allowLeaf]);
        expect(result.denyConditions).toEqual([]);
    });

    it('collects multiple ALLOW + CONDITIONAL into allowConditions', () => {
        const leaf2 = { field: 'watcherId', op: DslOperator.EQ, value: '$$user.id' };
        const rules = [
            makeRule('ALLOW', 'CONDITIONAL', allowLeaf),
            makeRule('ALLOW', 'CONDITIONAL', leaf2),
        ];
        const result = evaluator.evaluate(rules) as Extract<PolicyResult, { effect: 'conditional' }>;
        expect(result.allowConditions).toEqual([allowLeaf, leaf2]);
    });

    it('collects DENY + CONDITIONAL into denyConditions alongside ALLOW + CONDITIONAL', () => {
        const rules = [
            makeRule('ALLOW', 'CONDITIONAL', allowLeaf),
            makeRule('DENY', 'CONDITIONAL', denyLeaf),
        ];
        const result = evaluator.evaluate(rules) as Extract<PolicyResult, { effect: 'conditional' }>;
        expect(result.effect).toBe('conditional');
        expect(result.allowConditions).toEqual([allowLeaf]);
        expect(result.denyConditions).toEqual([denyLeaf]);
    });

    it('throws BadRequestException when CONDITIONAL rule has null conditions', () => {
        const rules = [makeRule('ALLOW', 'CONDITIONAL', null)];
        expect(() => evaluator.evaluate(rules)).toThrow('Conditional ABAC rule requires conditions');
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest policy-evaluator --no-coverage
```

Expected: FAIL — `Cannot find module './policy-evaluator.js'`

- [ ] **Step 3: Implement PolicyEvaluator**

```ts
// src/modules/abac/core/abac-core.policy-evaluator.ts

import { BadRequestException } from '@nestjs/common';
import { DslNode, PolicyResult } from './types.js';

// Uses string (not string literals) because RolePermissionRuleEffect is a TypeScript enum —
// enums are nominal types and are not assignable to string literals even when values match.
export interface RawRule {
    effect: string;
    type: string;
    conditions: unknown;
}

export class PolicyEvaluator {
    evaluate(rules: RawRule[]): PolicyResult {
        if (rules.length === 0) return { effect: 'deny' };

        if (rules.some((r) => r.effect === 'DENY' && r.type === 'FULL_ACCESS')) {
            return { effect: 'deny' };
        }

        const denyConditions = this.collectDenyConditional(rules);

        if (rules.some((r) => r.effect === 'ALLOW' && r.type === 'FULL_ACCESS')) {
            return { effect: 'full_access', denyConditions };
        }

        const allowConditions = this.collectAllowConditional(rules);

        return { effect: 'conditional', allowConditions, denyConditions };
    }

    private collectAllowConditional(rules: RawRule[]): DslNode[] {
        return rules
            .filter((r) => r.effect === 'ALLOW' && r.type === 'CONDITIONAL')
            .map((r) => {
                if (!r.conditions) {
                    throw new BadRequestException('Conditional ABAC rule requires conditions');
                }
                return r.conditions as DslNode;
            });
    }

    private collectDenyConditional(rules: RawRule[]): DslNode[] {
        return rules
            .filter((r) => r.effect === 'DENY' && r.type === 'CONDITIONAL')
            .map((r) => {
                if (!r.conditions) {
                    throw new BadRequestException('Conditional ABAC rule requires conditions');
                }
                return r.conditions as DslNode;
            });
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest policy-evaluator --no-coverage
```

Expected: PASS — 8 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/modules/abac/core/abac-core.policy-evaluator.ts src/modules/abac/core/policy-evaluator.spec.ts
git commit -m "feat(abac): add PolicyEvaluator with tests"
```

---

## Task 5: AbacEngine

**What:** Единственная точка входа в ядро. Оркестрирует `PolicyEvaluator` и `TemplateResolver` в правильном порядке: сначала оцениваем правила (evaluator), потом резолвим шаблоны (resolver) в условиях результата. Важно: шаблоны резолвятся только в `conditional` и `full_access` с denyConditions — если `deny`, всё равно возвращаем `deny` без лишней работы.

**Files:**
- Create: `src/modules/abac/core/abac-core.engine.ts`
- Create: `src/modules/abac/core/abac-engine.spec.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/modules/abac/core/abac-engine.spec.ts

import { AbacEngine } from './abac-engine.js';
import { PolicyEvaluator } from './policy-evaluator.js';
import { TemplateResolver } from './template-resolver.js';
import { DslOperator } from './constants.js';
import { AuthProvider } from '../../../infrastructure/database/prisma/generated/enums.js';

const mockUser = { id: 42, email: 'user@test.com', provider: AuthProvider.EMAIL };
const context = { user: mockUser };

const makeRule = (
    effect: 'ALLOW' | 'DENY',
    type: 'CONDITIONAL' | 'FULL_ACCESS',
    conditions: unknown = null,
) => ({ id: 1, rolePermissionId: 1, effect, type, conditions, createdAt: new Date(), updatedAt: new Date() });

describe('AbacEngine', () => {
    let engine: AbacEngine;

    beforeEach(() => {
        engine = new AbacEngine(new PolicyEvaluator(), new TemplateResolver());
    });

    it('returns deny when no rules', () => {
        const result = engine.buildPolicy([], context);
        expect(result).toEqual({ effect: 'deny' });
    });

    it('returns full_access with empty denyConditions for ALLOW + FULL_ACCESS', () => {
        const rules = [makeRule('ALLOW', 'FULL_ACCESS')];
        const result = engine.buildPolicy(rules, context);
        expect(result).toEqual({ effect: 'full_access', denyConditions: [] });
    });

    it('resolves $$user.id template in allowConditions', () => {
        const rules = [
            makeRule('ALLOW', 'CONDITIONAL', { field: 'assigneeId', op: DslOperator.EQ, value: '$$user.id' }),
        ];
        const result = engine.buildPolicy(rules, context);
        expect(result).toEqual({
            effect: 'conditional',
            allowConditions: [{ field: 'assigneeId', op: DslOperator.EQ, value: 42 }],
            denyConditions: [],
        });
    });

    it('resolves $$user.id template in denyConditions', () => {
        const rules = [
            makeRule('ALLOW', 'FULL_ACCESS'),
            makeRule('DENY', 'CONDITIONAL', { field: 'assigneeId', op: DslOperator.EQ, value: '$$user.id' }),
        ];
        const result = engine.buildPolicy(rules, context);
        expect(result).toEqual({
            effect: 'full_access',
            denyConditions: [{ field: 'assigneeId', op: DslOperator.EQ, value: 42 }],
        });
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest abac-engine --no-coverage
```

Expected: FAIL — `Cannot find module './abac-engine.js'`

- [ ] **Step 3: Implement AbacEngine**

```ts
// src/modules/abac/core/abac-core.engine.ts

import { PolicyEvaluator, RawRule } from './policy-evaluator.js';
import { TemplateResolver } from './template-resolver.js';
import { AbacContext, DslNode, PolicyResult } from './types.js';

export class AbacEngine {
    constructor(
        private readonly evaluator: PolicyEvaluator,
        private readonly templateResolver: TemplateResolver,
    ) {}

    buildPolicy(rules: RawRule[], context: AbacContext): PolicyResult {
        const policy = this.evaluator.evaluate(rules);

        if (policy.effect === 'deny') return policy;

        if (policy.effect === 'full_access') {
            return {
                effect: 'full_access',
                denyConditions: policy.denyConditions.map((node) =>
                    this.templateResolver.resolve(node, context),
                ),
            };
        }

        return {
            effect: 'conditional',
            allowConditions: policy.allowConditions.map((node) =>
                this.templateResolver.resolve(node, context),
            ),
            denyConditions: policy.denyConditions.map((node) =>
                this.templateResolver.resolve(node, context),
            ),
        };
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest abac-engine --no-coverage
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/modules/abac/core/abac-core.engine.ts src/modules/abac/core/abac-engine.spec.ts
git commit -m "feat(abac): add AbacEngine with tests"
```

---

## Task 6: PrismaWhereBuilder

**What:** Единственный класс, который знает про Prisma. Принимает `PolicyResult` от движка и строит Prisma WHERE объект. Рекурсивно обходит `DslNode` дерево и транслирует каждый оператор (`eq` → `{ field: value }`, `in` → `{ field: { in: [...] } }` и т.д.). Множественные `allowConditions` объединяются через `OR`, а `denyConditions` добавляются как `NOT` через `AND`. Не знает ничего о конкретных моделях (Task, User) — работает с любой Prisma-моделью.

**Files:**
- Create: `src/modules/abac/adapters/prisma-where-builder.ts`
- Create: `src/modules/abac/adapters/prisma-where-builder.spec.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/modules/abac/adapters/prisma-where-builder.spec.ts

import { PrismaWhereBuilder } from './prisma-where-builder.js';
import { PolicyResult } from '../core/types.js';
import { DslOperator, LogicalOperator } from '../core/constants.js';

describe('PrismaWhereBuilder', () => {
    let builder: PrismaWhereBuilder;

    beforeEach(() => {
        builder = new PrismaWhereBuilder();
    });

    it('returns null for deny', () => {
        const policy: PolicyResult = { effect: 'deny' };
        expect(builder.build(policy)).toBeNull();
    });

    it('returns empty object for full_access with no denyConditions', () => {
        const policy: PolicyResult = { effect: 'full_access', denyConditions: [] };
        expect(builder.build(policy)).toEqual({});
    });

    it('adds NOT clause for full_access with denyConditions', () => {
        const policy: PolicyResult = {
            effect: 'full_access',
            denyConditions: [{ field: 'status', op: DslOperator.EQ, value: 'archived' }],
        };
        expect(builder.build(policy)).toEqual({ NOT: { status: 'archived' } });
    });

    it('wraps multiple denyConditions in NOT OR', () => {
        const policy: PolicyResult = {
            effect: 'full_access',
            denyConditions: [
                { field: 'status', op: DslOperator.EQ, value: 'archived' },
                { field: 'status', op: DslOperator.EQ, value: 'deleted' },
            ],
        };
        expect(builder.build(policy)).toEqual({
            NOT: { OR: [{ status: 'archived' }, { status: 'deleted' }] },
        });
    });

    it('returns WHERE with single allowCondition (no OR wrapper)', () => {
        const policy: PolicyResult = {
            effect: 'conditional',
            allowConditions: [{ field: 'assigneeId', op: DslOperator.EQ, value: 42 }],
            denyConditions: [],
        };
        expect(builder.build(policy)).toEqual({ assigneeId: 42 });
    });

    it('wraps multiple allowConditions in OR', () => {
        const policy: PolicyResult = {
            effect: 'conditional',
            allowConditions: [
                { field: 'assigneeId', op: DslOperator.EQ, value: 42 },
                { field: 'watcherId', op: DslOperator.EQ, value: 42 },
            ],
            denyConditions: [],
        };
        expect(builder.build(policy)).toEqual({
            OR: [{ assigneeId: 42 }, { watcherId: 42 }],
        });
    });

    it('combines allowConditions and denyConditions in AND', () => {
        const policy: PolicyResult = {
            effect: 'conditional',
            allowConditions: [{ field: 'assigneeId', op: DslOperator.EQ, value: 42 }],
            denyConditions: [{ field: 'status', op: DslOperator.EQ, value: 'archived' }],
        };
        expect(builder.build(policy)).toEqual({
            AND: [{ assigneeId: 42 }, { NOT: { status: 'archived' } }],
        });
    });

    describe('operator mapping', () => {
        const build = (op: string, value: unknown) => {
            const b = new PrismaWhereBuilder();
            return b.build({
                effect: 'conditional',
                allowConditions: [{ field: 'x', op: op as DslOperator, value: value as never }],
                denyConditions: [],
            });
        };

        it('eq → { x: value }', () => expect(build('eq', 1)).toEqual({ x: 1 }));
        it('neq → { x: { not: value } }', () => expect(build('neq', 1)).toEqual({ x: { not: 1 } }));
        it('in → { x: { in: [...] } }', () => expect(build('in', [1, 2])).toEqual({ x: { in: [1, 2] } }));
        it('not_in → { x: { notIn: [...] } }', () => expect(build('not_in', [1, 2])).toEqual({ x: { notIn: [1, 2] } }));
        it('gt → { x: { gt: value } }', () => expect(build('gt', 5)).toEqual({ x: { gt: 5 } }));
        it('gte → { x: { gte: value } }', () => expect(build('gte', 5)).toEqual({ x: { gte: 5 } }));
        it('lt → { x: { lt: value } }', () => expect(build('lt', 5)).toEqual({ x: { lt: 5 } }));
        it('lte → { x: { lte: value } }', () => expect(build('lte', 5)).toEqual({ x: { lte: 5 } }));
        it('contains → { x: { has: value } }', () => expect(build('contains', 42)).toEqual({ x: { has: 42 } }));
    });

    it('translates nested DslGroup (OR group inside conditional)', () => {
        const policy: PolicyResult = {
            effect: 'conditional',
            allowConditions: [
                {
                    operator: LogicalOperator.OR,
                    conditions: [
                        { field: 'assigneeId', op: DslOperator.EQ, value: 42 },
                        { field: 'watcherId', op: DslOperator.EQ, value: 42 },
                    ],
                },
            ],
            denyConditions: [],
        };
        expect(builder.build(policy)).toEqual({
            OR: [{ assigneeId: 42 }, { watcherId: 42 }],
        });
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest prisma-where-builder --no-coverage
```

Expected: FAIL — `Cannot find module './prisma-where-builder.js'`

- [ ] **Step 3: Implement PrismaWhereBuilder**

```ts
// src/modules/abac/adapters/prisma-where-builder.ts

import { IWhereBuilder, PolicyResult, DslNode, DslLeaf, DslValue } from '../core/types.js';
import { DslOperator, LogicalOperator } from '../core/constants.js';

type PrismaWhere = Record<string, unknown>;

export class PrismaWhereBuilder implements IWhereBuilder<PrismaWhere> {
    build(policy: PolicyResult): PrismaWhere | null {
        if (policy.effect === 'deny') return null;

        if (policy.effect === 'full_access') {
            if (policy.denyConditions.length === 0) return {};
            return { NOT: this.buildDenyClause(policy.denyConditions) };
        }

        const allowClause = this.buildAllowClause(policy.allowConditions);
        if (policy.denyConditions.length === 0) return allowClause;

        return {
            AND: [allowClause, { NOT: this.buildDenyClause(policy.denyConditions) }],
        };
    }

    private buildAllowClause(conditions: DslNode[]): PrismaWhere {
        if (conditions.length === 1) return this.buildNode(conditions[0]);
        return { OR: conditions.map((c) => this.buildNode(c)) };
    }

    private buildDenyClause(conditions: DslNode[]): PrismaWhere {
        if (conditions.length === 1) return this.buildNode(conditions[0]);
        return { OR: conditions.map((c) => this.buildNode(c)) };
    }

    private buildNode(node: DslNode): PrismaWhere {
        if ('field' in node) return this.buildLeaf(node);
        return this.buildGroup(node);
    }

    private buildLeaf(leaf: DslLeaf): PrismaWhere {
        const { field, op, value } = leaf;

        switch (op) {
            case DslOperator.EQ:        return { [field]: value };
            case DslOperator.NEQ:       return { [field]: { not: value } };
            case DslOperator.IN:        return { [field]: { in: value } };
            case DslOperator.NOT_IN:    return { [field]: { notIn: value } };
            case DslOperator.GT:        return { [field]: { gt: value } };
            case DslOperator.GTE:       return { [field]: { gte: value } };
            case DslOperator.LT:        return { [field]: { lt: value } };
            case DslOperator.LTE:       return { [field]: { lte: value } };
            case DslOperator.CONTAINS:  return { [field]: { has: value } };
        }
    }

    private buildGroup(group: { operator: string; conditions: DslNode[] }): PrismaWhere {
        const clauses = group.conditions.map((c) => this.buildNode(c));
        return group.operator === LogicalOperator.OR ? { OR: clauses } : { AND: clauses };
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest prisma-where-builder --no-coverage
```

Expected: PASS — all tests passing

- [ ] **Step 5: Commit**

```bash
git add src/modules/abac/adapters/prisma-where-builder.ts src/modules/abac/adapters/prisma-where-builder.spec.ts
git commit -m "feat(abac): add PrismaWhereBuilder adapter with tests"
```

---

## Task 7: NestJS module wiring

**What:** Подключаем чистое ядро в NestJS через `DynamicModule`. `AbacModule.forRoot({ whereBuilder })` регистрирует движок и сервис с нужным адаптером. `AbacService` — тонкая NestJS-обёртка: загружает правила через `RbacService`, передаёт их в `AbacEngine`, строит WHERE через адаптер. Метод переименовывается с `buildTaskWhereOrThrow` на `buildWhereOrThrow` — больше нет привязки к конкретному ресурсу.

**Files:**
- Modify: `src/modules/abac/abac.module.ts`
- Modify: `src/modules/abac/abac.service.ts`
- Modify: `src/modules/abac/index.ts`

- [ ] **Step 1: Rewrite abac.service.ts**

```ts
// src/modules/abac/abac.service.ts

import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { RbacService } from '../rbac/services/rbac.service.js';
import { AbacEngine } from './core/abac-engine.js';
import { IWhereBuilder } from './core/types.js';
import { ActiveUser } from '../../common/types/common.types.js';
import { PermissionKey } from '../rbac/rbac.types.js';

export const WHERE_BUILDER_TOKEN = Symbol('WHERE_BUILDER_TOKEN');

@Injectable()
export class AbacService {
    constructor(
        private readonly rbacService: RbacService,
        private readonly abacEngine: AbacEngine,
        @Inject(WHERE_BUILDER_TOKEN) private readonly whereBuilder: IWhereBuilder<Record<string, unknown>>,
    ) {}

    async buildWhereOrThrow(
        user: ActiveUser,
        permissionKey: PermissionKey,
    ): Promise<Record<string, unknown>> {
        const rolePermissions = await this.rbacService.getUserRolePermissionsWithRulesByPermission(
            user.id,
            permissionKey,
        );

        const rules = rolePermissions.flatMap((rp) => rp.rules);
        const policy = this.abacEngine.buildPolicy(rules, { user });
        const where = this.whereBuilder.build(policy);

        if (where === null) throw new ForbiddenException('Insufficient permissions');

        return where;
    }
}
```

- [ ] **Step 2: Rewrite abac.module.ts**

```ts
// src/modules/abac/abac.module.ts

import { Module, DynamicModule } from '@nestjs/common';
import { RbacModule } from '../rbac/index.js';
import { AbacService, WHERE_BUILDER_TOKEN } from './abac.service.js';
import { AbacEngine } from './core/abac-engine.js';
import { PolicyEvaluator } from './core/policy-evaluator.js';
import { TemplateResolver } from './core/template-resolver.js';
import { IWhereBuilder } from './core/types.js';

export interface AbacModuleOptions {
    whereBuilder: IWhereBuilder<Record<string, unknown>>;
}

@Module({})
export class AbacModule {
    static forRoot(options: AbacModuleOptions): DynamicModule {
        return {
            module: AbacModule,
            imports: [RbacModule],
            providers: [
                {
                    provide: WHERE_BUILDER_TOKEN,
                    useValue: options.whereBuilder,
                },
                {
                    provide: AbacEngine,
                    useFactory: () => new AbacEngine(new PolicyEvaluator(), new TemplateResolver()),
                },
                AbacService,
            ],
            exports: [AbacService],
        };
    }
}
```

- [ ] **Step 3: Update index.ts barrel exports**

```ts
// src/modules/abac/index.ts

export { AbacModule } from './abac.module.js';
export { AbacService } from './abac.service.js';
export type { DslNode, DslLeaf, DslGroup, DslValue, PolicyResult, IWhereBuilder, AbacContext } from './core/types.js';
export { DslOperator, LogicalOperator } from './core/constants.js';
```

- [ ] **Step 4: Update AppModule to use forRoot**

Find where `AbacModule` is registered in `AppModule` (or wherever it's imported) and update:

```ts
// In AppModule imports array — replace AbacModule with:
AbacModule.forRoot({ whereBuilder: new PrismaWhereBuilder() }),
```

Add import at the top of the file:
```ts
import { PrismaWhereBuilder } from './modules/abac/adapters/prisma-where-builder.js';
```

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/modules/abac/abac.service.ts src/modules/abac/abac.module.ts src/modules/abac/index.ts
git commit -m "feat(abac): wire AbacEngine into NestJS module with forRoot pattern"
```

---

## Task 8: Update TasksService

**What:** `TasksService` уже использует ABAC, но через старый метод `buildTaskWhereOrThrow`. Переключаем на новый `buildWhereOrThrow`. Возвращаемый тип — `Record<string, unknown>`, который кастится к `Prisma.TaskWhereInput` — это безопасно, потому что `PrismaWhereBuilder` производит валидные Prisma WHERE объекты.

**Files:**
- Modify: `src/modules/tasks/services/tasks.service.ts`

- [ ] **Step 1: Update findAll and findOneById in TasksService**

Найди оба вызова `buildTaskWhereOrThrow` в `src/modules/tasks/services/tasks.service.ts` и замени:

```ts
// было:
const accessWhere = await this.abacService.buildTaskWhereOrThrow(user, 'TASKS:READ');

// стало:
const accessWhere = await this.abacService.buildWhereOrThrow(user, 'TASKS:READ') as Prisma.TaskWhereInput;
```

Добавь импорт `Prisma` если его нет:
```ts
import { Prisma } from '@database/client';
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Start the server and manually verify tasks endpoint works**

```bash
npm run start:dev
```

Make a GET request to `/tasks` with a valid auth token. Expected: 200 with task list (or 403 if no ABAC rules configured yet — this is fine at this stage).

- [ ] **Step 4: Commit**

```bash
git add src/modules/tasks/services/tasks.service.ts
git commit -m "feat(tasks): update TasksService to use generic buildWhereOrThrow"
```

---

## Task 9: Admin API — Rule CRUD

**What:** Эндпоинты для управления `RolePermissionRule` из админки. Добавляем в существующий `RbacController` (который уже защищён `RBAC:READ`). POST/PATCH принимают `conditions` в DSL-формате и валидируют через Zod.

**Files:**
- Modify: `src/modules/rbac/rbac.controller.ts`
- Modify: `src/modules/rbac/services/rbac.service.ts`
- Modify: `src/modules/rbac/repositories/rbac.repository.ts`

- [ ] **Step 1: Add Zod schema and DTO for rule creation**

Создай файл `src/modules/rbac/dto/create-rule.dto.ts`:

```ts
// src/modules/rbac/dto/create-rule.dto.ts

import { z } from 'zod';
import { DslOperator, LogicalOperator } from '../../abac/core/constants.js';

const dslOperatorEnum = z.nativeEnum(DslOperator);
const logicalOperatorEnum = z.nativeEnum(LogicalOperator);
const dslValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const dslNodeSchema: z.ZodType = z.lazy(() =>
    z.union([
        z.object({
            field: z.string().min(1),
            op: dslOperatorEnum,
            value: z.union([dslValueSchema, z.array(dslValueSchema)]),
        }),
        z.object({
            operator: logicalOperatorEnum,
            conditions: z.array(dslNodeSchema).min(1),
        }),
    ]),
);

export const createRuleSchema = z
    .object({
        effect: z.enum(['ALLOW', 'DENY']),
        type: z.enum(['CONDITIONAL', 'FULL_ACCESS']),
        conditions: dslNodeSchema.nullable().optional(),
    })
    .refine(
        (data) => data.type !== 'CONDITIONAL' || data.conditions != null,
        { message: 'conditions is required for CONDITIONAL type', path: ['conditions'] },
    );

export type CreateRuleDto = z.infer<typeof createRuleSchema>;

export const updateRuleSchema = createRuleSchema.partial().refine(
    (data) => data.type !== 'CONDITIONAL' || data.conditions != null,
    { message: 'conditions is required for CONDITIONAL type', path: ['conditions'] },
);

export type UpdateRuleDto = z.infer<typeof updateRuleSchema>;
```

- [ ] **Step 2: Add rule methods to RbacRepository**

В `src/modules/rbac/repositories/rbac.repository.ts` добавь:

```ts
async getRulesForRolePermission(roleId: number, permissionId: number) {
    return this.database.rolePermissionRule.findMany({
        where: {
            rolePermission: { roleId, permissionId },
        },
    });
}

async createRule(
    roleId: number,
    permissionId: number,
    data: { effect: string; type: string; conditions: unknown },
) {
    const rolePermission = await this.database.rolePermission.findUniqueOrThrow({
        where: {
            uq_roles_permissions_role_permission: { roleId, permissionId },
        },
    });

    return this.database.rolePermissionRule.create({
        data: {
            rolePermissionId: rolePermission.id,
            effect: data.effect as RolePermissionRuleEffect,
            type: data.type as RolePermissionRuleType,
            conditions: data.conditions ?? Prisma.DbNull,
        },
    });
}

async updateRule(ruleId: number, data: { effect?: string; type?: string; conditions?: unknown }) {
    return this.database.rolePermissionRule.update({
        where: { id: ruleId },
        data: {
            ...(data.effect && { effect: data.effect as RolePermissionRuleEffect }),
            ...(data.type && { type: data.type as RolePermissionRuleType }),
            ...(data.conditions !== undefined && {
                conditions: data.conditions ?? Prisma.DbNull,
            }),
        },
    });
}

async deleteRule(ruleId: number) {
    return this.database.rolePermissionRule.delete({ where: { id: ruleId } });
}
```

Add imports at top of file:
```ts
import { Prisma, RolePermissionRuleEffect, RolePermissionRuleType } from '@database/client';
```

- [ ] **Step 3: Add rule methods to RbacService**

В `src/modules/rbac/services/rbac.service.ts` добавь:

```ts
async getRulesForRolePermission(roleId: number, permissionId: number) {
    return this.rbacRepository.getRulesForRolePermission(roleId, permissionId);
}

async createRule(roleId: number, permissionId: number, dto: CreateRuleDto) {
    return this.rbacRepository.createRule(roleId, permissionId, dto);
}

async updateRule(roleId: number, ruleId: number, dto: UpdateRuleDto) {
    return this.rbacRepository.updateRule(ruleId, dto);
}

async deleteRule(ruleId: number) {
    return this.rbacRepository.deleteRule(ruleId);
}
```

Add imports:
```ts
import { CreateRuleDto, UpdateRuleDto } from '../dto/create-rule.dto.js';
```

- [ ] **Step 4: Add rule endpoints to RbacController**

В `src/modules/rbac/rbac.controller.ts` добавь:

```ts
@Get('roles/:roleId/permissions')
@RequiredPermissions('RBAC:READ')
getRolePermissions(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.rbacService.findAllRolesWithPermissions();
}

@Get('roles/:roleId/permissions/:permissionId/rules')
@RequiredPermissions('RBAC:READ')
getRules(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
) {
    return this.rbacService.getRulesForRolePermission(roleId, permissionId);
}

@Post('roles/:roleId/permissions/:permissionId/rules')
@RequiredPermissions('RBAC:UPDATE')
async createRule(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
    @Body() body: unknown,
) {
    const dto = createRuleSchema.parse(body);
    return this.rbacService.createRule(roleId, permissionId, dto);
}

@Patch('roles/:roleId/permissions/:permissionId/rules/:ruleId')
@RequiredPermissions('RBAC:UPDATE')
async updateRule(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('ruleId', ParseIntPipe) ruleId: number,
    @Body() body: unknown,
) {
    const dto = updateRuleSchema.parse(body);
    return this.rbacService.updateRule(roleId, ruleId, dto);
}

@Delete('roles/:roleId/permissions/:permissionId/rules/:ruleId')
@RequiredPermissions('RBAC:UPDATE')
async deleteRule(
    @Param('ruleId', ParseIntPipe) ruleId: number,
) {
    return this.rbacService.deleteRule(ruleId);
}
```

Add imports at top:
```ts
import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { createRuleSchema, updateRuleSchema } from './dto/create-rule.dto.js';
```

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/modules/rbac/
git commit -m "feat(rbac): add rule CRUD endpoints for ABAC management"
```

---

## Task 10: Update seed with DSL conditions

**What:** Текущий seed либо не создаёт условия, либо создаёт их в старом Prisma-формате. Обновляем на DSL-формат чтобы сервер поднимался с правильными данными после `prisma db seed`.

**Files:**
- Modify: `src/infrastructure/database/prisma/seed.ts`

- [ ] **Step 1: Find and update CONDITIONAL rule conditions in seed**

Найди в `src/infrastructure/database/prisma/seed.ts` место где создаются `RolePermissionRule` с `type: CONDITIONAL`. Замени `conditions` с Prisma-формата на DSL-формат:

```ts
// было (Prisma WHERE формат):
conditions: { assigneeId: { equals: userId } }

// стало (DSL формат):
conditions: { field: 'assigneeId', op: 'eq', value: '$$user.id' }
```

Для правил READ/UPDATE/DELETE для роли USER — условие "только свои задачи":
```ts
conditions: { field: 'assigneeId', op: 'eq', value: '$$user.id' }
```

- [ ] **Step 2: Reset and re-seed the database**

```bash
npx prisma db seed
```

Expected: seed completes without errors

- [ ] **Step 3: Smoke test the application**

```bash
npm run start:dev
```

Make a GET request to `/tasks` with a USER-role token. Expected: returns only tasks where user is assignee.

- [ ] **Step 4: Commit**

```bash
git add src/infrastructure/database/prisma/seed.ts
git commit -m "refactor(seed): update ABAC conditions to DSL format"
```

---

## Task 11: Cleanup old ABAC files

**What:** Удаляем старые файлы, которые были заменены новой реализацией. Это важно сделать в конце, когда всё работает — не раньше.

**Files:**
- Delete: `src/modules/abac/services/abac-task-access.service.ts`
- Delete: `src/modules/abac/services/abac-template-resolver.service.ts`
- Delete: `src/modules/abac/services/abac.service.ts`
- Delete: `src/modules/abac/abac.abac-core.constants.ts`
- Delete: `src/modules/abac/abac.types.ts`
- Delete: `src/modules/abac/abac.guards.ts`

- [ ] **Step 1: Delete old service files**

```bash
rm src/modules/abac/services/abac-task-access.service.ts
rm src/modules/abac/services/abac-template-resolver.service.ts
rm src/modules/abac/services/abac.service.ts
rm src/modules/abac/abac.abac-core.constants.ts
rm src/modules/abac/abac.types.ts
rm src/modules/abac/abac.guards.ts
```

- [ ] **Step 2: Run TypeScript check to confirm no broken imports**

```bash
npx tsc --noEmit
```

Expected: no errors. If there are errors, fix the broken imports.

- [ ] **Step 3: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(abac): remove old resource-coupled ABAC implementation"
```

---

## Running all tests

```bash
npx jest --no-coverage
```

All tasks in the core (`template-resolver`, `policy-evaluator`, `abac-engine`, `prisma-where-builder`) should have passing unit tests. Coverage of the core logic is the most important part — the NestJS wiring and admin API are covered by e2e tests if you have them.
