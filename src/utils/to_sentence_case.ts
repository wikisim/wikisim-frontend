

export function to_sentence_case(str: string): string
{
    if (!str) return str
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase().replace(/_/g, " ")
}
