import { Card } from "@mantine/core"

import { format_data_component_value_to_string } from "core/data/format/format_data_component_value_to_string"
import { DataComponent } from "core/data/interface"

import { ROUTES } from "../routes"
import { sanitize_with_TipTap } from "../text_editor/sanitise_html"
import "./DataComponentCard.css"


export function DataComponentCard({ data_component }: { data_component: DataComponent })
{
    const value_as_string = format_data_component_value_to_string(data_component)

    return (
        <Card
            component="a"
            href={ROUTES.DATA_COMPONENT.VIEW_WIKI_COMPONENT(data_component.id.id)}
            // className="data-component-card tiptap-content"
            className="data-component-card"
        >
            <h3 dangerouslySetInnerHTML={{ __html: sanitize_with_TipTap(data_component.title, true) }} />
            <p>{ellipsis(data_component.plain_description)}</p>
            {value_as_string && <p>{value_as_string}</p>}
        </Card>
    )
}


function ellipsis(text: string): string
{
    // Limit the text to 120 characters, adding an ellipsis if it exceeds that length
    return text.length > 120 ? text.slice(0, 120) + "..." : text
}
