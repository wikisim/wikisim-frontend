import { Tooltip } from "@mantine/core"
import { DataComponent } from "core/data/interface"
import { useLocation } from "preact-iso"

import { IconAlternative, IconBackReferences } from "../../assets/icons"
import { get_currently_pressed_keys } from "../../pub_sub/publish_key_down_events"
import { ROUTES } from "../../routes"
import { app_store } from "../../state/store"
import "./DataComponentMetrics.css"


export function DataComponentMetrics(props: { component: DataComponent })
{
    const { component } = props

    const state = app_store()
    const location = useLocation()
    // state.data_components.request_metrics(component.id)
    const async_metrics = state.data_components.request_metrics(component.id)
    const { metrics } = async_metrics
    const alternatives = metrics?.alternative_component_ids.length ?? 0
    const back_references = metrics?.back_reference_component_ids.length ?? 0

    const label_back_references = `See references to this component`
    const label_alternatives = `See and create alternatives`

    const route_view_back_references = ROUTES.DATA_COMPONENT.VIEW_BACK_REFERENCES(component.id.as_IdOnly())
    const route_view_alternatives = ROUTES.DATA_COMPONENT.VIEW_ALTERNATIVES(component.id.as_IdOnly())

    return <div id="data-component-metrics">
        <Tooltip label={label_back_references} position="bottom">
            <a
                className="metric-row-and-link"
                href={route_view_back_references}
                onClick={e =>
                {
                    // Allow users to open the back references page in a new tab with
                    // metaKey (cmd on mac)
                    if (get_currently_pressed_keys().metaKey) return

                    e.preventDefault()
                    location.route(route_view_back_references)
                }}
            >
                <IconBackReferences /> Referenced by <span className="back-references-count">{back_references}</span>
            </a>
        </Tooltip>
        {component.subject_id === undefined && <Tooltip label={label_alternatives} position="bottom">
            <a
                className="metric-row-and-link"
                href={route_view_alternatives}
                onClick={e =>
                {
                    // Allow users to open the alternatives page in a new tab with
                    // metaKey (cmd on mac)
                    if (get_currently_pressed_keys().metaKey) return

                    e.preventDefault()
                    location.route(route_view_alternatives)
                }}
            >
                <IconAlternative /> Fork <span className="alternatives-count">{alternatives}</span>
            </a>
        </Tooltip>}
    </div>
}
