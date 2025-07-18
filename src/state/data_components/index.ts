import { request_data_components } from "core/data/fetch_from_db"
import type { IdAndMaybeVersion } from "core/data/id"
import type { DataComponent } from "core/data/interface"
import type { GetSupabase } from "core/supabase"

import { wait_for } from "../../utils/wait_for"
import { GetAppState, RootAppState, SetAppState } from "../interface"
import { AppStore } from "../store"
import { DataComponentsState } from "./interface"


export function initial_state(set: SetAppState, get: GetAppState, get_supabase: GetSupabase): DataComponentsState
{
    return {
        data_component_ids_to_load: [],
        data_component_ids_for_home_page: undefined,
        data_component_by_id_and_maybe_version: {},

        request_data_component_error: undefined,
        request_data_component: (data_component_id: IdAndMaybeVersion) =>
        {
            const { data_component_by_id_and_maybe_version } = get().data_components
            const id_str = data_component_id.to_str()

            let async_data_component = data_component_by_id_and_maybe_version[id_str]

            if (!async_data_component)
            {
                // console .debug(`Data component with ID ${data_component_id} not found.  Requesting to load it.`)

                async_data_component = {
                    id: data_component_id,
                    component: null,
                    status: "requested",
                }

                set(state =>
                {
                    state.data_components.data_component_ids_to_load.push(data_component_id)
                    state.data_components.data_component_by_id_and_maybe_version[id_str] = async_data_component!

                    return state
                })
            }

            return async_data_component
        },

        request_data_components: async () =>
        {
            const { data_component_ids_for_home_page } = get().data_components

            if (data_component_ids_for_home_page?.status === "loading")
            {
                console. warn("Data components already loading, do not call request_data_components whilst loading")
                return
            }

            set(state =>
            {
                if (!state.data_components.data_component_ids_for_home_page)
                {
                    // If we don't already have a data_component_ids_for_home_page, set one to loading
                    state.data_components.data_component_ids_for_home_page = {
                        status: "loading",
                        fetched: new Date(),
                        ids: undefined,
                    }
                }
                else
                {
                    // Otherwise, reset it to loading but leave the ids as they were
                    state.data_components.data_component_ids_for_home_page.status = "loading"
                    state.data_components.data_component_ids_for_home_page.fetched = new Date()
                    state.data_components.data_component_ids_for_home_page.error = undefined
                }
                return state
            })

            const response = await request_data_components(get_supabase, [], { page: 0, size: 10 })

            set(state =>
            {
                let { data_component_ids_for_home_page } = state.data_components
                if (!data_component_ids_for_home_page)
                {
                    console.error("Data component IDs for home page not set before response received")
                    data_component_ids_for_home_page = {
                        status: "loading",
                        error: undefined,
                        fetched: new Date(),
                        ids: undefined,
                    }
                }

                if (response.error)
                {
                    data_component_ids_for_home_page.status = "error"
                    data_component_ids_for_home_page.error = `${response.error}`
                }
                else
                {
                    // Set the data components for the home page
                    data_component_ids_for_home_page = {
                        fetched: data_component_ids_for_home_page.fetched,
                        status: "loaded",
                        error: undefined,
                        ids: response.data.map(component => component.id),
                    }
                    state = update_store_with_loaded_data_components(response.data, state)
                }

                state.data_components.data_component_ids_for_home_page = data_component_ids_for_home_page
                return state
            })
        },
    }
}


export function subscriptions(core_store: AppStore, get_supabase: GetSupabase)
{
    core_store.subscribe((state: RootAppState) =>
    {
        load_requested_data_components(state, core_store.setState, get_supabase)
    })
}



async function load_requested_data_components(
    state: RootAppState,
    set_state: SetAppState,
    get_supabase: GetSupabase,
)
{
    const { data_component_ids_to_load } = state.data_components
    // If there are no components to request, return early, otherwise trigger a load
    if (data_component_ids_to_load.length === 0) return
    const id_numbers = data_component_ids_to_load.map(id => id.id)

    // Test pollution.  This wait allows us to check that the state is updated correctly.
    await wait_for(0)

    set_state(state =>
    {
        // Set the status of all requested data components to "loading"
        data_component_ids_to_load.forEach(id =>
        {
            const { data_component_by_id_and_maybe_version } = state.data_components
            const entry = data_component_by_id_and_maybe_version[id.to_str()]
            // type guard, should not happen
            if (!entry) throw new Error(`Exception: No placeholder found for data component with ID ${id.to_str()}`)
            entry.status = "loading"
            // Leave component as it is.  Perhaps we might be refreshing an existing component?
            // entry.component = null
        })

        state.data_components.data_component_ids_to_load = []
        return state
    })

    // Request from supabase
    const response = await request_data_components(get_supabase, id_numbers)

    if (response.error)
    {
        set_state(state =>
        {
            state.data_components.request_data_component_error = response.error

            data_component_ids_to_load.forEach(id =>
            {
                const { data_component_by_id_and_maybe_version } = state.data_components
                const entry = data_component_by_id_and_maybe_version[id.to_str()]
                // type guard, should not happen
                if (!entry) throw new Error(`Exception: No placeholder found for data component with ID ${id.to_str()}`)
                entry.status = "error"
                entry.error = `${response.error}`
                // entry.component = null // Leave component as it was in case we were refreshing an existing component
            })

            return state
        })
        return
    }

    set_state(state =>
    {
        return update_store_with_loaded_data_components(response.data, state, data_component_ids_to_load)
    })
}


export function update_store_with_loaded_data_components(
    data: DataComponent[],
    state: RootAppState,
    expected_ids: IdAndMaybeVersion[] = [],
): RootAppState
{
    const expected_ids_to_load: Set<string> = new Set(expected_ids.map(id => id.to_str()))

    data.forEach(instance =>
    {
        const id_str = instance.id.to_str()
        const id_only = instance.id.to_str_without_version()

        // For each entry, find it's placeholder in `data_components_by_id_only`
        // and update it with the loaded data component
        const { data_component_by_id_and_maybe_version } = state.data_components
        data_component_by_id_and_maybe_version[id_str] = {
            id: instance.id,
            component: instance,
            status: "loaded",
            error: undefined,
        }

        const id_only_instance = data_component_by_id_and_maybe_version[id_only]?.component
        if (!id_only_instance || id_only_instance.id.version < instance.id.version)
        {
            // If the ID without version is not present, or the version is earlier
            // than the one we just loaded, the upsert it to our local store
            data_component_by_id_and_maybe_version[id_only] = {
                id: instance.id,
                component: instance,
                status: "loaded",
                error: undefined,
            }
        }

        expected_ids_to_load.delete(id_str)
        expected_ids_to_load.delete(id_only)
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

    return state
}
