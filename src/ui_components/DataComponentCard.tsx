import { Card } from "@mantine/core"

import { DataComponent } from "core/data/interface"

import { ROUTES } from "../routes"
import { sanitize_with_TipTap } from "../text_editor/sanitise_html"
import "./DataComponentCard.css"


export function DataComponentCard({ data_component }: { data_component: DataComponent })
{
    return (
        <Card
            component="a"
            href={ROUTES.DATA_COMPONENT.VIEW(data_component.id.id)}
            // className="data-component-card tiptap-content"
            className="data-component-card"
        >
            <h3 dangerouslySetInnerHTML={{ __html: sanitize_with_TipTap(data_component.title, true) }} />
            <p dangerouslySetInnerHTML={{ __html: sanitize_with_TipTap(data_component.description, false) }} />
        </Card>
    )
}
