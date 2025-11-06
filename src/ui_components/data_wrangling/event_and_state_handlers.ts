import { useCallback, useState } from "preact/hooks"
import { convert_array_paths_to_wildcards } from "./convert_array_paths_to_wildcards"
import { HoveringJSONPath, JSONPath, SelectedJSONPath } from "./interface"


function on_hovering_handler()
{
    const [hovering_path, set_hovering_path] = useState<HoveringJSONPath>()

    const on_hovering_path = useCallback((path: JSONPath, is_leaf_value: boolean) =>
    {
        path = convert_array_paths_to_wildcards(path)
        set_hovering_path({ path, is_leaf_value })
    }, [])

    return {
        hovering_path,
        on_hovering_path,
    }
}


const max_wildcards = 1
function on_selected_handler()
{
    const [selected_paths, set_selected_paths] = useState<SelectedJSONPath[]>([])

    const on_selected_path = useCallback((path: JSONPath, is_leaf_value: boolean) =>
    {
        if (!is_leaf_value) return
        path = convert_array_paths_to_wildcards(path, max_wildcards)

        const path_str = JSON.stringify(path)
        set_selected_paths(paths =>
        {
            // Check if path is already selected, if already selected then
            // remove it, otherwise add it
            const initial_path_count = paths.length
            paths = paths.filter(p => JSON.stringify(p.path) !== path_str)

            // If paths.length not changed then it means path was not already
            // selected so we add it
            if (paths.length === initial_path_count)
            {
                const alias = make_alias(path, paths)
                paths = [...paths, { path, alias }]
            }

            return paths
        })
    }, [])

    return {
        selected_paths,
        on_selected_path,
        max_wildcards,
    }
}


export function event_and_state_handlers()
{
    return {
        ...on_hovering_handler(),
        ...on_selected_handler(),
    }
}
export type JSONViewerEventAndStateHandlers = ReturnType<typeof event_and_state_handlers>


export function make_alias(path: JSONPath, existing_paths: SelectedJSONPath[])
{
    const existing_aliases = new Set(existing_paths.map(p => p.alias))

    let path_position = path.length - 1
    let canditate_alias = get_alias_path(path, path_position)
    while (existing_aliases.has(canditate_alias) && path_position > 0)
    {
        path_position -= 1
        canditate_alias = get_alias_path(path, path_position) + "_" + canditate_alias
    }

    return canditate_alias
}

function get_alias_path(path: JSONPath, position: number): string
{
    const path_element = path[position]!
    const parent_path_element = path[position - 1]

    if ("key" in path_element) return path_element.key

    if (!parent_path_element) return "index_" + path_element.index.toString()

    if ("key" in parent_path_element) return parent_path_element.key + "_" + path_element.index

    return `${parent_path_element.index}_index_${path_element.index}`
}
