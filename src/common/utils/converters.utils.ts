export function emptyToUndefined({ value }: { value: unknown }) {
    return value === '' || value === null ? undefined : value;
}

export function emptyToUndefinedDate({ value }: { value: unknown }) {
    if (value === '' || value === null || value === undefined) return undefined;

    return value instanceof Date ? value : new Date(value as string | number);
}

export function toArrayOrUndefined({ value }: { value: unknown }) {
    if (value === undefined || value === null || value === '') return undefined;

    // @gutnidev ну блин, тебе не подсвечивает?
    return Array.isArray(value) ? value : [value];
}
