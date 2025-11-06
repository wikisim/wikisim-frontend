import { JSONPath } from "./interface"


interface ExtractDataAtPathReturn
{
    extracted_data: string | number | (string | number)[]
    all_missing: boolean
}
export function extract_data_at_path(data: unknown, path_components: JSONPath, max_wildcards = 1): ExtractDataAtPathReturn
{
    max_wildcards = Math.min(1, max_wildcards) // Limit to 1 wildcard for now

    let current_data = data
    let all_missing = true
    for (let i = 0; i < path_components.length; ++i)
    {
        const element = path_components[i]!
        const is_last = path_components.length - 1 === i

        if (current_data === null || current_data === undefined)
        {
            current_data = `${current_data}`
        }

        else if ("index" in element && Array.isArray(current_data))
        {
            if (element.index === "*")
            {
                // If last element or exceeded max_wildcards then return the entire array
                if (is_last || max_wildcards <= 0)
                {
                    // pass through current_data (which is an array) as-is.
                    all_missing = false
                    break
                }
                else
                {
                    // If wildcard not last element in path or not maxed out
                    // wildcard count then collect all sub-elements
                    const results: (string | number)[] = []
                    for (const item of current_data)
                    {
                        const sub_path = path_components.slice(i + 1)
                        const sub_result = extract_data_at_path(item, sub_path, max_wildcards - 1)
                        if (Array.isArray(sub_result.extracted_data)) results.push(JSON.stringify(sub_result.extracted_data))
                        else results.push(sub_result.extracted_data)

                        all_missing = all_missing && sub_result.all_missing
                    }

                    return { extracted_data: results, all_missing }
                }
            }
            else
            {
                if (is_last && element.index < current_data.length) all_missing = false
                current_data = current_data[element.index]
            }
        }
        else if ("key" in element && typeof current_data === "object" && !Array.isArray(current_data))
        {
            const current_data_obj = current_data as Record<string, unknown>
            current_data = current_data_obj[element.key]
            if (is_last && (element.key in current_data_obj)) all_missing = false
        }
        else
        {
            current_data = `${undefined}`
        }
    }

    const extracted_data = ensure_result_is_string_or_array(current_data)

    return { extracted_data, all_missing }
}


function ensure_result_is_string_or_array(data: unknown): string | number | (string | number)[]
{
    if (data === null || data === undefined)
    {
        return `${data}`
    }
    else if (typeof data === "string" || typeof data === "number")
    {
        return data
    }
    else if (Array.isArray(data))
    {
        const results: (string | number)[] = []
        data.forEach(item =>
        {
            if (item === null || item === undefined)
            {
                results.push(`${item}`)
            }
            else if (typeof item === "string" || typeof item === "number")
            {
                results.push(item)
            }
            else
            {
                results.push(JSON.stringify(item))
            }
        })

        return results
    }
    else
    {
        return JSON.stringify(data)
    }
}
