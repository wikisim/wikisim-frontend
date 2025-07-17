import { request_data_components } from "core/data/fetch_from_db"
import { IdAndMaybeVersion } from "core/data/id"
import { DataComponent } from "core/data/interface"
import { GetSupabase } from "core/supabase"

import { GetAppState, RootAppState, SetAppState } from "../interface"
import { AppStore } from "../store"
import { DataComponentsState } from "./interface"


export function initial_state(set: SetAppState, get: GetAppState): DataComponentsState
{
    return {
        data_component_ids_to_load: [],
        data_component_by_id_and_maybe_version: {},

        request_data_component_error: undefined,
        request_data_component: (data_component_id: string | IdAndMaybeVersion) =>
        {
            const { data_component_by_id_and_maybe_version } = get().data_components
            const id = IdAndMaybeVersion.from_str(data_component_id)
            const id_str = id.to_str()

            let data_component = data_component_by_id_and_maybe_version[id_str]

            if (!data_component)
            {
                // console .debug(`Data component with ID ${data_component_id} not found.  Requesting to load it.`)

                data_component = {
                    id,
                    component: null,
                    status: "requested",
                }
                const new_data_component = data_component

                set(state =>
                {
                    state.data_components.data_component_ids_to_load.push(id)
                    state.data_components.data_component_by_id_and_maybe_version[id_str] = new_data_component

                    return state
                })
            }

            return data_component
        }


    }
}


export function subscriptions(core_store: AppStore, get_supabase: GetSupabase)
{
    core_store.subscribe((state: RootAppState) =>
    {
        load_requested_data_components(state, core_store, get_supabase)
    })
}



async function load_requested_data_components(
    state: RootAppState,
    core_store: AppStore,
    get_supabase: GetSupabase,
)
{
    const { data_component_ids_to_load } = state.data_components
    // If there are no components to request, return early, otherwise trigger a load
    if (data_component_ids_to_load.length === 0) return
    const ids_to_load: number[] = data_component_ids_to_load.map(id => id.id)

    // Request from supabase
    const response = await request_data_components(get_supabase, ids_to_load)

    if (response.error)
    {
        core_store.setState(state =>
        {
            state.data_components.request_data_component_error = response.error
            return state
        })
        return
    }

    update_store_with_loaded_data_components(ids_to_load, core_store, response.data)
}


function update_store_with_loaded_data_components(
    expected_ids: number[],
    core_store: AppStore,
    data: DataComponent[],
)
{
    const expected_ids_to_load: Set<number> = new Set(expected_ids)

    core_store.setState(state =>
    {
        data.forEach(instance =>
        {
            // For each entry, find it's placeholder in `data_components_by_id_only`
            // and update it with the loaded data component
            const { data_component_by_id_and_maybe_version } = state.data_components
            const entry = data_component_by_id_and_maybe_version[instance.id]
            // type guard, should not happen
            if (!entry) throw new Error(`Exception: No placeholder found for data component with ID ${instance.id}`)

            entry.status = "loaded"
            entry.component = instance
            expected_ids_to_load.delete(instance.id)
        })

        expected_ids_to_load.forEach(id =>
        {
            // If there are any IDs that were expected to be loaded but were not found,
            // we set their status to "not_found"
            const { data_component_by_id_and_maybe_version } = state.data_components
            const entry = data_component_by_id_and_maybe_version[id]
            // type guard, should not happen
            if (!entry) throw new Error(`Exception: No placeholder found for data component with ID ${id}`)

            entry.status = "not_found"
            entry.component = null
        })

        // Clear the request list
        state.data_components.data_component_ids_to_load = []
        return state
    })
}
