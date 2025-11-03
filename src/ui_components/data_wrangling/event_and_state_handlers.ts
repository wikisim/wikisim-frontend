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


function on_selected_handler()
{
    const [selected_paths, set_selected_paths] = useState<SelectedJSONPath[]>([])

    const on_selected_path = useCallback((path: JSONPath, is_leaf_value: boolean) =>
    {
        if (!is_leaf_value) return
        path = convert_array_paths_to_wildcards(path)

        const path_str = JSON.stringify(path)
        set_selected_paths(paths =>
        {
            // Check if path is already selected, if already selected then
            // remove it, otherwise add it
            const initial_path_count = paths.length
            paths = paths.filter(p => JSON.stringify(p.path) !== path_str)
            if (paths.length === initial_path_count)
            {
                const path_element = path[path.length - 1]!
                const parent_path_element = path[path.length - 2]
                const alias = (
                    "key" in path_element
                    ? path_element.key
                    : (
                        (parent_path_element && "key" in parent_path_element)
                        ? parent_path_element.key
                        : "index"
                    )
                ).toString()
                paths = [...paths, { path, alias }]
            }

            return paths
        })
    }, [])

    return {
        selected_paths,
        on_selected_path,
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
