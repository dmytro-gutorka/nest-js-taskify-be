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

export const DslLogicalOperator = {
    AND: 'AND',
    OR: 'OR',
} as const;

export const PolicyEffect = {
    DENY: 'DENY',
    FULL_ACCESS: 'FULL_ACCESS',
    CONDITIONAL: 'CONDITIONAL',
} as const;

export const ABAC_TEMPLATE_REGISTRY: Record<string, string> = {
    '$$user.id': 'user.id',
    '$$user.email': 'user.email',
};

export const PermissionRuleEffect = {
    ALLOW: 'ALLOW',
    DENY: 'DENY',
} as const;

export const PermissionRuleType = {
    CONDITIONAL: 'CONDITIONAL',
    FULL_ACCESS: 'FULL_ACCESS',
} as const;
