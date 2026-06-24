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
