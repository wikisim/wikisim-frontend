import { parse_id } from "core/data/id"

import { RootAppState } from "../interface"
import { AsyncDataComponent } from "./interface"


export function get_async_data_component(state: RootAppState, data_component_id: string, force_refresh?: boolean): AsyncDataComponent
{
    const { data_component_by_id_and_maybe_version } = state.data_components

    let data_component = data_component_by_id_and_maybe_version[data_component_id]

    if (!data_component || (force_refresh && data_component.status === "loaded"))
    {
        // console .debug(`Data component with ID ${data_component_id} not found.  Requesting to load it.`)
        const id = parse_id(data_component_id)
        data_component = state.data_components.request_data_component(id, force_refresh)
    }

    return data_component
}
