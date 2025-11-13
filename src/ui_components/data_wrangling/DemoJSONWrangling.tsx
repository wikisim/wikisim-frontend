import { JSONPath } from "core/data/interface"

import { extract_selected_data } from "./extract_selected_data"
import { get_json_data_handlers } from "./json_data_handlers"
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

    const {
        hovering_path,
        on_hovering_path,

        selected_paths,
        on_selected_path,
        selected_path_names,
        upsert_selected_path_name,
    } = get_json_data_handlers()


    const extracted_data = extract_selected_data(sample_data, selected_paths)

    return <div style={{ padding: "20px" }}>
        <h2>JSON Viewer Demo Object</h2>
        <p style={{ color: hovering_path?.is_leaf_value === false ? "red" : "inherit" }}>
            Hovering path: {(hovering_path?.path.length || 0) === 0 ? "(none)" : ""}
            {humanised_path(hovering_path?.path)}
        </p>
        <p>
            Selected paths: {selected_paths.length === 0 ? "none" : ""}
            {selected_paths.map(p => <div
                key={JSON.stringify(p)}
                style={{ cursor: "pointer" }}
                onClick={() => on_selected_path(p, true)}
            >
                {p} ({humanised_path(p)})
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
            extracted_data={extracted_data}
            valid_selected_paths={selected_paths}
            selected_path_names={selected_path_names}
            upsert_path_name={upsert_selected_path_name}
        />

        <hr />

        <h2>JSON Viewer Demo List</h2>
        <JSONViewer data={sample_data.items} />
    </div>
}
