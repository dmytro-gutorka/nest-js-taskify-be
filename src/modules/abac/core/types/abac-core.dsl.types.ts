import { ValueOf } from '../../../../common/types/common.types.js';
import { DslLogicalOperator, DslOperator } from '../constants/abac-core.constants.js';

export type DlsLogicalOperator = ValueOf<typeof DslLogicalOperator>;
export type DslOperator = ValueOf<typeof DslOperator>;
export type DslValue = string | number | boolean | null;

export interface DslLeaf<TField extends string = string> {
    op: DslOperator;
    field: TField;
    value: DslValue | DslValue[];
}

// Example:
// { "field": "assigneeId", "op": "eq", "value": "$$user.id" }

export interface DslGroup<TField extends string = string> {
    operator: DlsLogicalOperator;
    conditions: DslNode<TField>[];
}

// Example:
// {
//     "operator": "OR",
//     "conditions": [
//     { "field": "assigneeId", "op": "eq", "value": "$$user.id" },
//     { "field": "status", "op": "eq", "value": "archived" }
// ]
// }

export type DslNode<TField extends string = string> = DslLeaf<TField> | DslGroup<TField>;
