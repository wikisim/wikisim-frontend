import { Tooltip } from "@mantine/core"
import { DataComponent } from "core/data/interface"
import { useLocation } from "preact-iso"

import { IconAlternative } from "../../assets/icons"
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
    const label = `See and create alternatives`
    const route = ROUTES.DATA_COMPONENT.VIEW_ALTERNATIVES(component.id.as_IdOnly())

    return <div id="data-component-metrics">
        {component.subject_id === undefined && <Tooltip label={label} position="bottom">
            <a
                className="alternatives"
                href={route}
                onClick={e =>
                {
                    // Allow users to open the alternatives page in a new tab with
                    // metaKey (cmd on mac)
                    if (get_currently_pressed_keys().metaKey) return

                    e.preventDefault()
                    location.route(route)
                }}
            >
                <IconAlternative /> Fork <span className="alternatives-count">{alternatives}</span>
            </a>
        </Tooltip>}
    </div>
}
