import { useCallback, useState } from "preact/hooks"

import { JSONPath, MapSelectedPathToName } from "core/data/interface"

import { convert_array_paths_to_wildcards } from "./convert_array_paths_to_wildcards"
import { HoveringJSONPath } from "./interface"


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
    const [selected_paths, set_selected_paths] = useState<JSONPath[]>([])
    const [selected_path_names, set_selected_path_names] = useState<MapSelectedPathToName>({})


    const upsert_selected_path_name = useCallback((path: JSONPath, name?: string) =>
    {
        const path_str = JSON.stringify(path)
        set_selected_path_names(names =>
        {
            name = name ?? make_name_from_path(path, names)

            if (names[path_str] === name) return names

            return { ...names, [path_str]: name }
        })
    }, [])


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
            paths = paths.filter(p => JSON.stringify(p) !== path_str)

            // If paths.length not changed then it means path was not already
            // selected so we add it
            if (paths.length === initial_path_count)
            {
                paths = [...paths, path]

                upsert_selected_path_name(path)
            }
            else
            {
                // Remove the path name mapping as well
                set_selected_path_names(names =>
                {
                    const new_names = { ...names }
                    delete new_names[path_str]
                    return new_names
                })
            }

            return paths
        })
    }, [])


    return {
        selected_path_names,
        upsert_selected_path_name,

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


export function make_name_from_path(path: JSONPath, existing_names: MapSelectedPathToName): string
{
    const existing_names_set = new Set(Object.values(existing_names))

    let path_position = path.length - 1
    let canditate_name = candidate_name_from_path(path, path_position)
    while (existing_names_set.has(canditate_name) && path_position > 0)
    {
        path_position -= 1
        canditate_name = candidate_name_from_path(path, path_position) + "_" + canditate_name
    }

    return canditate_name
}

function candidate_name_from_path(path: JSONPath, position: number): string
{
    const path_element = path[position]!
    const parent_path_element = path[position - 1]

    if ("key" in path_element) return path_element.key

    if (!parent_path_element) return "index_" + path_element.index.toString()

    if ("key" in parent_path_element) return parent_path_element.key + "_" + path_element.index

    return `${parent_path_element.index}_index_${path_element.index}`
}
