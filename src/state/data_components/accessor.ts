import { IdOnly, parse_id } from "core/data/id"
import { ERRORS } from "core/errors"

import { RootAppState } from "../interface"
import { AsyncDataComponent } from "./interface"


export function get_async_data_component(state: RootAppState, data_component_id: string, force_refresh?: boolean): AsyncDataComponent
{
    try
    {
        const id = parse_id(data_component_id)
        return state.data_components.request_data_component(id, force_refresh)
    } catch (e)
    {
        const error = e instanceof Error ? e : String(e)
        const error_str = error.toString()
        if (error_str.includes(ERRORS.ERR47.message) || error_str.includes(ERRORS.ERR48.message))
        {
            return {
                id: new IdOnly(0),
                component: null,
                status: "not_found",
            }
        }


        console.warn("Error in get_async_data_component:", e)
        return {
            id: new IdOnly(0),
            component: null,
            status: "error",
            error,
        }
    }
}
