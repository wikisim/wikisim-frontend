import { Card } from "@mantine/core"

import { format_data_component_value_to_string } from "core/data/format/format_data_component_value_to_string"
import { DataComponent } from "core/data/interface"

import { ROUTES } from "../routes"
import { ReadOnly } from "../text_editor/santisise_html/sanitise_html"
import "./DataComponentCard.css"


export function DataComponentCard({ data_component }: { data_component: DataComponent })
{
    const { value_type, created_at } = data_component

    const value_as_string = (value_type === "number" || value_type === undefined)
        ? format_data_component_value_to_string(data_component)
        : value_type

    return (
        <Card
            component="a"
            href={ROUTES.DATA_COMPONENT.VIEW_WIKI_COMPONENT(data_component.id.id)}
            // className="data-component-card tiptap-content"
            className="data-component-card"
        >
            <h3><ReadOnly html={data_component.title} single_line={true} /></h3>
            <p>{ellipsis(data_component.plain_description)}</p>
            {value_as_string && <p>{value_as_string}</p>}

            <div class="metadata">
                <span>{new Date(created_at).toLocaleDateString()}</span>
            </div>
        </Card>
    )
}


function ellipsis(text: string): string
{
    // Limit the text to 120 characters, adding an ellipsis if it exceeds that length
    return text.length > 120 ? text.slice(0, 120) + "..." : text
}
