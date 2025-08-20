import { parse_id } from "core/data/id"

import { RootAppState } from "../interface"
import { AsyncDataComponent } from "./interface"


export function get_async_data_component(state: RootAppState, data_component_id: string, force_refresh?: boolean): AsyncDataComponent
{
    const id = parse_id(data_component_id)
    return state.data_components.request_data_component(id, force_refresh)
}
