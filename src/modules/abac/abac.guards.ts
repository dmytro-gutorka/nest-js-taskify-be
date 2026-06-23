import {AbacCondition, AbacJsonObject} from "./abac.types.js";

function isPlainObject(value: unknown): value is AbacJsonObject {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isAbacCondition(value: unknown): value is Exclude<AbacCondition, null> {
    if (isPlainObject(value)) return true;
    if (Array.isArray(value)) return value.every(isPlainObject);

    return false;
}