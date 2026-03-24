import { Tooltip } from "@mantine/core"
import { DataComponent } from "core/data/interface"
import { useLocation } from "preact-iso"

import { IconAlternative } from "../../assets/icons"
import { ROUTES } from "../../routes"
import { app_store } from "../../state/store"
import "./DataComponentMetrics.css"


export function DataComponentMetrics(props: { component: DataComponent })
{
    const state = app_store()
    const location = useLocation()
    // state.data_components.request_metrics(props.component.id)
    const async_metrics = state.data_components.request_metrics(props.component.id)
    const { metrics } = async_metrics
    const alternatives = metrics?.alternative_component_ids.length ?? 0
    const label = `See and create alternatives`

    return <div className="data-component-metrics">
        <Tooltip label={label} position="bottom">
            <div
                className="alternatives-count"
                onClick={() =>
                {
                    const route = ROUTES.DATA_COMPONENT.VIEW_ALTERNATIVES(props.component.id.as_IdOnly())
                    location.route(route)
                }}
            >
                <IconAlternative /> Fork {alternatives}
            </div>
        </Tooltip>
    </div>
}
