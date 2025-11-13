import { useCallback, useMemo, useState } from "preact/hooks"

import { JSONPath, MapSelectedPathToName, Scenario } from "core/data/interface"

import { convert_array_paths_to_wildcards } from "./convert_array_paths_to_wildcards"
import { HoveringJSONPath } from "./interface"


function get_on_hovering_handler()
{
    const [hovering_path, set_hovering_path] = useState<HoveringJSONPath>()

    const on_hovering_path = useCallback((path: JSONPath, is_leaf_value: boolean) =>
    {
        path = convert_array_paths_to_wildcards(path)
        set_hovering_path({ path, is_leaf_value })
    }, [])

    return useMemo(() => ({
        hovering_path,
        on_hovering_path,
    }), [hovering_path, on_hovering_path])
}


const max_wildcards = 1
function get_on_selected_handler(current_scenario?: Scenario, on_upsert_scenario?: (updated_scenario: Partial<Scenario>) => void)
{
    const selected_paths = current_scenario?.selected_paths || []
    const selected_path_names = current_scenario?.selected_path_names || {}


    const upsert_selected_path_name = useCallback((path: JSONPath, name?: string, delete_path=false) =>
    {
        // Type guard
        if (!current_scenario?.selected_path_names || !on_upsert_scenario) return
        const names = { ...current_scenario.selected_path_names }

        const path_str = JSON.stringify(path)
        name = name ?? make_name_from_path(path, names)

        if (names[path_str] === name) return
        else names[path_str] = name

        if (delete_path) delete names[path_str]

        on_upsert_scenario({ selected_path_names: names })
    }, [current_scenario?.selected_path_names, on_upsert_scenario])


    const on_selected_path = useCallback((path: JSONPath, is_leaf_value: boolean) =>
    {
        if (!is_leaf_value) return
        let paths = current_scenario?.selected_paths
        // Type guard
        if (!paths || !on_upsert_scenario) return

        path = convert_array_paths_to_wildcards(path, max_wildcards)

        const path_str = JSON.stringify(path)
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
            upsert_selected_path_name(path, undefined, true)
        }

        on_upsert_scenario({ selected_paths: paths })
    }, [current_scenario?.selected_paths, on_upsert_scenario, upsert_selected_path_name])


    return useMemo(() => ({
        selected_path_names,
        upsert_selected_path_name,

        selected_paths,
        on_selected_path,
        max_wildcards,
    }), [
        selected_path_names,
        upsert_selected_path_name,
        selected_paths,
        on_selected_path,
        max_wildcards,
    ])
}


export function get_json_data_handlers(scenario?: Scenario, on_upsert_scenario?: (updated_scenario: Partial<Scenario>) => void)
{
    const on_hovering_handler = get_on_hovering_handler()
    const on_selected_handler = get_on_selected_handler(scenario, on_upsert_scenario)

    return useMemo(() => ({
        ...on_hovering_handler,
        ...on_selected_handler,
    }), [
        on_hovering_handler,
        on_selected_handler,
    ])
}
export type JSONViewerEventAndStateHandlers = ReturnType<typeof get_json_data_handlers>


export function make_name_from_path(path: JSONPath, existing_names: MapSelectedPathToName): string
{
    const existing_names_set = new Set(Object.values(existing_names))

    let path_position = path.length - 1
    let canditate_name = candidate_name_from_path(path, path_position)
    while (existing_names_set.has(canditate_name) && path_position > 0)
    {
        path_position -= 1
        canditate_name = candidate_name_from_path(path, path_position) + " " + canditate_name
    }

    return canditate_name
}

function candidate_name_from_path(path: JSONPath, position: number): string
{
    const path_element = path[position]!
    const parent_path_element = path[position - 1]

    if ("key" in path_element) return path_element.key

    if (!parent_path_element || !("key" in parent_path_element)) return "index-" + path_element.index.toString()

    return parent_path_element.key + "-" + path_element.index
}
