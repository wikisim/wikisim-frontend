

export function pluralise(singular: string, count: number): string
{
    return `${singular}${count !== 1 ? "s" : ""}`
}
