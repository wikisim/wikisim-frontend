

export function is_pure_number(value: string | undefined): boolean
{
    if (value === undefined) return false

    const trimmed = value.trim()
    return !isNaN(Number(trimmed)) && !isNaN(parseFloat(trimmed))
}
