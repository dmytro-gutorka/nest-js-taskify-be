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
