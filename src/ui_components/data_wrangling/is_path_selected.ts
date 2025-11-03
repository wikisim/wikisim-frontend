import { convert_array_paths_to_wildcards } from "./convert_array_paths_to_wildcards"
import { JSONPath } from "./interface"


export function factory_is_path_selected(current_path: JSONPath)
{
    const converted_path = convert_array_paths_to_wildcards(current_path)
    const converted_path_str = JSON.stringify(converted_path)

    return (selected_path_strs: Set<string>) => selected_path_strs.has(converted_path_str)
}
