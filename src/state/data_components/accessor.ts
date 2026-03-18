import { IdAndMaybeVersion, IdOnly, parse_id } from "core/data/id"
import { AsyncDataComponent, AsyncDataComponentAndDependencies } from "core/data/interface"
import { ERRORS } from "core/errors"

import { RootAppState } from "../interface"


export function get_async_data_component(state: RootAppState, data_component_id: string, force_refresh?: boolean): AsyncDataComponent
{
    try
    {
        const id = parse_id(data_component_id)
        return state.data_components.request_data_component(id, force_refresh)
    } catch (e)
    {
        const error = e instanceof Error ? e : new Error(String(e))
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


export function get_async_data_components(state: RootAppState, data_component_ids: (string | IdAndMaybeVersion)[]): AsyncDataComponent[]
{
    try
    {
        const ids = data_component_ids.map(id => parse_id(id))
        return state.data_components.request_data_components(ids)
    } catch (e)
    {
        const error = e instanceof Error ? e : new Error(String(e))
        const error_str = error.toString()
        if (error_str.includes(ERRORS.ERR47.message) || error_str.includes(ERRORS.ERR48.message))
        {
            return [{
                id: new IdOnly(0),
                component: null,
                status: "not_found",
            }]
        }

        console.warn("Error in get_async_data_components:", e)
        return [{
            id: new IdOnly(0),
            component: null,
            status: "error",
            error,
        }]
    }
}


/**
 * TODO: merge this with load_referenced_data_components
 */
export function get_async_data_component_and_dependencies(state: RootAppState, data_component_id: string, force_refresh?: boolean): AsyncDataComponentAndDependencies
{
    // First request the component by its id
    const async_component = get_async_data_component(state, data_component_id, force_refresh)
    const { component } = async_component

    if (!component) return {
        ...async_component,
        dependencies: [],
        to_load: 1,
        loaded: 0,
        all_loaded: false,
    }

    // Then request all of the components recursive_dependency_ids
    const { recursive_dependency_ids = [] } = component

    const recursive_dependencies = get_async_data_components(state, recursive_dependency_ids)
    const loaded_dependent_async_components = recursive_dependencies.filter(d => d.status === "loaded")

    const to_load = recursive_dependency_ids.length + 1
    const loaded = loaded_dependent_async_components.length + 1
    const any_error = recursive_dependencies.find(d => d.status === "error")?.error

    return {
        ...async_component,
        dependencies: recursive_dependencies,
        to_load,
        loaded,
        all_loaded: recursive_dependencies.length === loaded_dependent_async_components.length,
        error: async_component.error || any_error,
    }
}
