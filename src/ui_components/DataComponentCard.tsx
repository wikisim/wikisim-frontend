import { DataComponent } from "../../lib/core/src/data/interface"
import { sanitize_with_TipTap } from "../text_editor/sanitise_html"


export function DataComponentCard({ data_component }: { data_component: DataComponent })
{
    return (
        <div className="data-component-card">
            <h3 dangerouslySetInnerHTML={{ __html: sanitize_with_TipTap(data_component.title, true) }} />
            <p dangerouslySetInnerHTML={{ __html: sanitize_with_TipTap(data_component.description, false) }} />
        </div>
    )
}
