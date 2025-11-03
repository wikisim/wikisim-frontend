import { JSONPath } from "./interface"


export function extract_data_at_path(data: unknown, path_components: JSONPath, max_wildcards = 1): string | number | (string | number)[]
{
    max_wildcards = Math.min(1, max_wildcards) // Limit to 1 wildcard for now

    let current_data = data
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
                // If last element or  in path then return the entire array
                if (is_last || max_wildcards <= 0)
                {
                    // pass through current_data (which is an array) as-is.
                }
                else
                {
                    // If wildcard not last element in path or maxed out
                    // wildcard count then collect all sub-elements
                    const results: (string | number)[] = []
                    for (const item of current_data)
                    {
                        const sub_path = path_components.slice(i + 1)
                        const sub_result = extract_data_at_path(item, sub_path, max_wildcards - 1)
                        if (Array.isArray(sub_result)) results.push(JSON.stringify(sub_result))
                        else results.push(sub_result)
                    }

                    return results
                }
            }
            else
            {
                current_data = current_data[element.index]
            }
        }
        else if ("key" in element && typeof current_data === "object" && !Array.isArray(current_data))
        {
            current_data = (current_data as Record<string, unknown>)[element.key]
        }
        else
        {
            current_data = `${undefined}`
        }
    }

    return ensure_result_is_string_or_array(current_data)
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
