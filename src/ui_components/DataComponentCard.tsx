import { useLocation } from "preact-iso"

import { DataComponent } from "core/data/interface"

import { ROUTES } from "../routes"
import { sanitize_with_TipTap } from "../text_editor/sanitise_html"
import "./DataComponentCard.css"


export function DataComponentCard({ data_component }: { data_component: DataComponent })
{
    const location = useLocation()

    return (
        <div
            // className="data-component-card tiptap-content"
            className="data-component-card"
            onClick={() => {
                location.route(ROUTES.DATA_COMPONENT.VIEW(data_component.id))
            }}
        >
            <h3 dangerouslySetInnerHTML={{ __html: sanitize_with_TipTap(data_component.title, true) }} />
            <p dangerouslySetInnerHTML={{ __html: sanitize_with_TipTap(data_component.description, false) }} />
        </div>
    )
}
