# ABAC System Design

**Date:** 2026-06-24
**Branch:** feature/abac-core
**Status:** Approved

---

## Overview

A scalable, universal Attribute-Based Access Control (ABAC) system that is:
- ORM-agnostic (core has zero Prisma/TypeORM dependencies)
- Resource-agnostic (works for tasks, users, or any entity)
- Reusable across projects (core module can be extracted to any NestJS project)
- Admin-manageable (rules and conditions are CRUD-able via admin API)

The system builds on the existing `RolePermission` + `RolePermissionRule` schema. 
ABAC runs **query-level only** — it produces an ORM WHERE clause applied at DB query time, which handles both list filtering and single-entity access checks.

---

## Architecture: Three Layers

```
┌──────────────────────────────────────────────────────┐
│  CORE (pure TypeScript, zero framework dependencies) │
│  src/modules/abac/core/                              │
│  ├── AbacEngine          (orchestrator)              │
│  ├── PolicyEvaluator     (ALLOW/DENY/FULL_ACCESS)    │
│  ├── TemplateResolver    ($$user.id → actual value)  │
│  └── types.ts            (DslNode, PolicyResult, etc)│
└─────────────────────┬────────────────────────────────┘
                      │ IWhereBuilder<T>
┌─────────────────────▼────────────────────────────────┐
│  NESTJS MODULE (thin wrapper)                        │
│  src/modules/abac/                                   │
│  ├── AbacModule.forRoot(options)                     │
│  └── AbacService<T>                                  │
└─────────────────────┬────────────────────────────────┘
                      │ concrete implementation
┌─────────────────────▼────────────────────────────────┐
│  PROJECT LAYER (project-specific)                    │
│  ├── PrismaWhereBuilder   (ORM adapter)              │
│  ├── AdminAbacController  (CRUD rules/conditions)    │
│  └── usage in TasksService, UsersService, etc.       │
└──────────────────────────────────────────────────────┘
```

Arrows flow downward only. Core knows nothing about NestJS or Prisma. 
The NestJS module knows nothing about Prisma. 
`PrismaWhereBuilder` knows nothing about specific resources (Task, User) — it is universal for any Prisma model.

---

## DSL Format

Conditions stored in `RolePermissionRule.conditions` (JsonB) use a standardized ORM-agnostic DSL. Two node types:

### DslLeaf — a single condition

`TField` is a generic parameter — the core defaults to `string`, resource-specific code narrows it to a union of known field names.

```ts
type DslOperator = 'eq' | 'neq' | 'in' | 'not_in' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';
type DslValue = string | number | boolean | null;

interface DslLeaf<TField extends string = string> {
    field: TField;
    op: DslOperator;
    value: DslValue | DslValue[];
}
```

### DslGroup — logical grouping

```ts
interface DslGroup<TField extends string = string> {
    operator: 'AND' | 'OR';
    conditions: DslNode<TField>[];
}

type DslNode<TField extends string = string> = DslLeaf<TField> | DslGroup<TField>;
```

### Resource-specific field types (project layer)

Each resource defines its allowed fields as a Zod enum — the TypeScript type is derived from it (single source of truth):

```ts
// tasks/abac/tasks-abac.schema.ts
const taskFieldEnum = z.enum(['assigneeId', 'status', 'watcherIds', 'projectId']);
export type TaskField = z.infer<typeof taskFieldEnum>; // 'assigneeId' | 'status' | ...
export type TaskDslNode = DslNode<TaskField>;

// Recursive Zod schema for runtime validation of DB-sourced conditions
export const taskDslNodeSchema: z.ZodType = z.lazy(() =>
    z.union([
        z.object({ field: taskFieldEnum, op: dslOperatorEnum, value: z.union([dslValueSchema, z.array(dslValueSchema)]) }),
        z.object({ operator: z.enum(['AND', 'OR']), conditions: z.array(taskDslNodeSchema).min(1) }),
    ]),
);
```

`z.lazy` is required for the recursive reference — it defers schema evaluation until parse time, when `taskDslNodeSchema` is already defined.

### Template variables

Values prefixed with `$$` are resolved from context at evaluation time:
- `$$user.id` → the authenticated user's id
- `$$user.email` → the authenticated user's email
- Additional templates are registered in `TemplateResolver`

### DSL examples

```json
// Simple: user sees only their own tasks
{ "field": "assigneeId", "op": "eq", "value": "$$user.id" }

// OR group: own tasks or tasks where user is a watcher
{
  "operator": "OR",
  "conditions": [
    { "field": "assigneeId", "op": "eq", "value": "$$user.id" },
    { "field": "watcherIds", "op": "contains", "value": "$$user.id" }
  ]
}

// Nested: (own OR watcher) AND status not archived
{
  "operator": "AND",
  "conditions": [
    {
      "operator": "OR",
      "conditions": [
        { "field": "assigneeId", "op": "eq", "value": "$$user.id" },
        { "field": "watcherIds", "op": "contains", "value": "$$user.id" }
      ]
    },
    { "field": "status", "op": "neq", "value": "archived" }
  ]
}
```

---

## Core Module

### `TemplateResolver`

Recursively walks a `DslNode`, finds string values prefixed with `$$`, and replaces them with real values from `AbacContext`.

```ts
interface AbacContext {
    user: ActiveUser;
}

class TemplateResolver {
    resolve(node: DslNode, context: AbacContext): DslNode
}
```

Template registry maps `$$user.id` → `user.id` (dot-path into context). New templates are added by extending the registry — no changes to the resolver logic.

### `PolicyEvaluator`

Implements the rule priority logic defined in the schema comment:

| Rules state | Result |
|---|---|
| No rules | `deny` |
| Any `DENY + FULL_ACCESS` | `deny` |
| Any `ALLOW + FULL_ACCESS` (no full deny) | `full_access` with collected `denyConditions` from `DENY + CONDITIONAL` rules |
| Only `ALLOW + CONDITIONAL` (no full deny/allow) | `conditional` with `allowConditions` and `denyConditions` |
| `ALLOW + CONDITIONAL` but conditions is null | throws `BadRequestException` |

`DENY + CONDITIONAL` rules are always collected into `denyConditions` regardless of the allow side. They add NOT clauses to the final WHERE — restricting records that match the deny condition even when the allow side is satisfied.

```ts
type PolicyResult =
    | { effect: 'deny' }
    | { effect: 'full_access'; denyConditions: DslNode[] }
    | { effect: 'conditional'; allowConditions: DslNode[]; denyConditions: DslNode[] };

class PolicyEvaluator {
    evaluate(rules: RolePermissionRule[]): PolicyResult
}
```

### `AbacEngine`

Single entry point into the core. Orchestrates `PolicyEvaluator` → `TemplateResolver`.

```ts
interface AbacEngine {
    buildPolicy(rules: RolePermissionRule[], context: AbacContext): PolicyResult;
}
```

### `IWhereBuilder<T>`

Interface implemented by ORM adapters:

```ts
interface IWhereBuilder<T> {
    build(policy: PolicyResult): T | null;
    // null  → caller should throw ForbiddenException
    // {}    → full access, no deny conditions
    // {...} → filtered WHERE:
    //   full_access + denyConditions  → WHERE NOT(deny1) AND NOT(deny2)
    //   conditional                   → WHERE (allow1 OR allow2) AND NOT(deny1) AND NOT(deny2)
}
```

---

## NestJS Module

### Registration

```ts
// In AppModule or a feature module:
AbacModule.forRoot({
    whereBuilder: new PrismaWhereBuilder(),
})
```

### `AbacService<T>`

```ts
@Injectable()
export class AbacService<T> {
    async buildWhereOrThrow(
        user: ActiveUser,
        permissionKey: PermissionKey,
    ): Promise<T>
}
```

Internally: fetches `RolePermissionRule[]` via `RbacService`, calls `AbacEngine.buildPolicy`, calls `IWhereBuilder.build`, throws `ForbiddenException` if result is `null`.

### Usage in resource services

```ts
// TasksService
async findAll(user: ActiveUser) {
    const where = await this.abacService.buildWhereOrThrow(user, 'tasks:read');
    return this.prisma.task.findMany({ where });
}

// UsersService — identical pattern, different permission key
async findAll(user: ActiveUser) {
    const where = await this.abacService.buildWhereOrThrow(user, 'users:read');
    return this.prisma.user.findMany({ where });
}
```

---

## PrismaWhereBuilder (ORM Adapter)

Universal Prisma adapter — works for any Prisma model. Recursively translates `DslNode` to Prisma WHERE:

```ts
class PrismaWhereBuilder implements IWhereBuilder<Record<string, unknown>> {
    build(policy: PolicyResult): Record<string, unknown> | null
    // deny                                → null
    // full_access, no denyConditions      → {}
    // full_access, with denyConditions    → { AND: [NOT(deny1), NOT(deny2)] }
    // conditional                         → { AND: [{ OR: [allow1, allow2] }, NOT(deny1), ...] }
    //   (single allowCondition skips the OR wrapper)
}
```

Operator mapping (Prisma):
| DSL op | Prisma equivalent |
|---|---|
| `eq` | `{ field: value }` |
| `neq` | `{ field: { not: value } }` |
| `in` | `{ field: { in: [...] } }` |
| `not_in` | `{ field: { notIn: [...] } }` |
| `gt` | `{ field: { gt: value } }` |
| `gte` | `{ field: { gte: value } }` |
| `lt` | `{ field: { lt: value } }` |
| `lte` | `{ field: { lte: value } }` |
| `contains` | `{ field: { has: value } }` (array field) |

---

## Admin API

### Endpoints

```
GET    /admin/roles/:roleId/permissions
GET    /admin/roles/:roleId/permissions/:permissionId/rules
POST   /admin/roles/:roleId/permissions/:permissionId/rules
PATCH  /admin/roles/:roleId/permissions/:permissionId/rules/:id
DELETE /admin/roles/:roleId/permissions/:permissionId/rules/:id
```

### Validation

`CreateRuleDto` / `UpdateRuleDto` validate `conditions` using the resource-specific Zod schema (e.g. `taskDslNodeSchema`):
- If `type === CONDITIONAL` → `conditions` is required and must pass the Zod schema
- If `type === FULL_ACCESS` → `conditions` is ignored
- `field` must be one of the resource's allowed fields (enforced by Zod enum)
- `op` must be one of the allowed operators
- `value` type must match the operator (`in`/`not_in` require an array; others require a primitive)

### Cache invalidation

After any rule change, `RbacCacheService` invalidates the cache for the affected role so new rules apply immediately.

### Response shape for GET permissions

```json
{
  "role": { "id": 1, "name": "user" },
  "permissions": [
    {
      "permission": { "key": "tasks:read", "resource": "tasks", "action": "read" },
      "rules": [
        {
          "id": 5,
          "effect": "allow",
          "type": "conditional",
          "conditions": {
            "operator": "OR",
            "conditions": [
              { "field": "assigneeId", "op": "eq", "value": "$$user.id" },
              { "field": "watcherIds", "op": "contains", "value": "$$user.id" }
            ]
          }
        }
      ]
    }
  ]
}
```

---

## File Structure

```
src/modules/abac/
├── core/
│   ├── abac-core.engine.ts
│   ├── abac-core.policy-evaluator.ts
│   ├── template-resolver.ts
│   └── types.ts
├── adapters/
│   └── prisma-where-builder.ts
├── abac.module.ts
├── abac.service.ts
└── index.ts
```

---

## Migration from Current Implementation

The existing `conditions` in `RolePermissionRule` store raw Prisma WHERE JSON. These must be migrated to DSL format. The migration is a one-time data transformation:

- Current: `{ "assigneeId": { "equals": 1 } }`
- New: `{ "field": "assigneeId", "op": "eq", "value": "$$user.id" }`

Existing files that will be removed or replaced:
- `abac-task-access.service.ts` — replaced by universal `PrismaWhereBuilder`
- `abac.service.ts` — rewritten as generic `AbacService<T>`
- `abac-template-resolver.service.ts` — moved to core as `TemplateResolver`
- `abac.abac-core.constants.ts` — template registry moves into core
- `abac.types.ts` — rewritten with new DSL types

---

## What This Does NOT Include

- Entity-level checks (evaluating conditions against an in-memory JS object) — not needed for this project's REST API architecture
- A separate ABAC package/npm library — the core lives in `src/modules/abac/core/` and is structured to be extractable later if needed
- Custom operator plugins — the operator set is fixed; adding new operators requires a code change
