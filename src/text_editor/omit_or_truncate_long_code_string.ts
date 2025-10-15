

export function omit_or_truncate_long_code_string(code_string: string, max_length: number = 100, max_lines: number = 8)
{
    const lines = code_string.split("\n")
    if (lines.length > max_lines)
    {
        const selected_lines = [
            ...lines.slice(0, max_lines / 2),
            "(...omitted...)",
            ...lines.slice(lines.length - (max_lines / 2), lines.length)
        ]

        return selected_lines.join("\n")
    }

    const accepted_lines: string[] = []
    for (const line of lines)
    {
        if (line.length < max_length) accepted_lines.push(line)
        else
        {
            accepted_lines.push(line.slice(0, max_length) + " (...truncated)")
        }
    }

    return accepted_lines.join("\n")
}
