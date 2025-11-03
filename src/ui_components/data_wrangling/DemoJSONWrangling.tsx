import { useCallback, useState } from "preact/hooks"

import { convert_array_paths_to_wildcards } from "./convert_array_paths_to_wildcards"
import { HoveringJSONPath, JSONPath, SelectedJSONPath } from "./interface"
import { JSONViewer } from "./JSONViewer"
import { TableViewer } from "./TableViewer"


function humanised_path(path: JSONPath | undefined): string
{
    if (!path || path.length === 0) return ""

    return path.map(p => "index" in p ? `[${p.index}]` : `.${p.key}`).join("").replace(/^\./, "")
}


export function DemoJSONWranglingDemo()
{
    const sample_data = {
        name: "Example",
        version: 1,
        isActive: true,
        items: [
            { id: 1, value: "Item 1" },
            { id: 2, value: "Item 2", details: { description: "This is item 2", tags: ["tag1", "tag2"] } },
            { id: 3, value: "Item 3" },
        ],
        numbers: [10, 20, 30, 40, 50],
        metadata: {
            created: "2024-01-01T12:00:00Z",
            modified: null,
            contributors: [
                { name: "Alice", role: "author" },
                { name: "Bob", role: "editor" },
            ],
        },
    }

    const [hovering_path, set_hovering_path] = useState<HoveringJSONPath>()
    const [selected_paths, set_selected_paths] = useState<SelectedJSONPath[]>([])


    const on_hovering_path = useCallback((path: JSONPath, is_leaf_value: boolean) =>
    {
        path = convert_array_paths_to_wildcards(path)
        set_hovering_path({ path, is_leaf_value })
    }, [])

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


    return <div style={{ padding: "20px" }}>
        <h2>JSON Viewer Demo Object</h2>
        <p style={{ color: hovering_path?.is_leaf_value === false ? "red" : "inherit" }}>
            Hovering path: {(hovering_path?.path.length || 0) === 0 ? "(none)" : ""}
            {humanised_path(hovering_path?.path)}
        </p>
        <p>
            Selected paths: {selected_paths.length === 0 ? "none" : ""}
            {selected_paths.map(p => <div
                key={JSON.stringify(p.path)}
                style={{ cursor: "pointer" }}
                onClick={() => on_selected_path(p.path, true)}
            >
                {p.alias} ({humanised_path(p.path)})
            </div>)}
        </p>
        <JSONViewer
            data={sample_data}
            on_hovering_path={on_hovering_path}
            hovered_path={hovering_path?.path}
            on_selected_path={on_selected_path}
            selected_paths={selected_paths}
        />

        <TableViewer
            data={sample_data}
            selected_paths={selected_paths}
        />

        <hr />

        <h2>JSON Viewer Demo List</h2>
        <JSONViewer data={sample_data.items} />
    </div>
}
