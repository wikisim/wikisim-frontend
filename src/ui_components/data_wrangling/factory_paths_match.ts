import { convert_array_paths_to_wildcards } from "./convert_array_paths_to_wildcards"
import { JSONPath } from "./interface"


export function factory_paths_match(current_path: JSONPath, max_wildcards: number | undefined)
{
    const converted_path = convert_array_paths_to_wildcards(current_path, max_wildcards)
    const converted_path_str = JSON.stringify(converted_path)

    return (path_strs: Set<string> | string) =>
    {
        if (typeof path_strs === "string") return converted_path_str === path_strs
        return path_strs.has(converted_path_str)
    }
}
