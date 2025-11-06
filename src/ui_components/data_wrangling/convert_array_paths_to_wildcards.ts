import { JSONPath } from "./interface"


export function convert_array_paths_to_wildcards(path: JSONPath, limit_wildcards?: number): JSONPath
{
    function wildcard(path_component: { index: number | "*" }): { index: number | "*" }
    {
        if (limit_wildcards === undefined) return { index: "*" }
        if (limit_wildcards <= 0)
        {
            const index = typeof path_component.index === "number" ? path_component.index : 0
            return { index }
        }

        limit_wildcards -= 1
        return { index: "*" }
    }

    return path.map(p => "index" in p ? wildcard(p) : { key: p.key })
}
