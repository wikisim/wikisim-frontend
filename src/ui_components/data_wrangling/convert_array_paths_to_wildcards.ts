import { JSONPath } from "./interface"


export function convert_array_paths_to_wildcards(path: JSONPath): JSONPath
{
    return path.map(p => "index" in p ? { index: "*" } : { key: p.key })
}
