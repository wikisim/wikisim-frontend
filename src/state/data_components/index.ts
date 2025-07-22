import { request_archived_data_components, request_data_components } from "core/data/fetch_from_db"
import { all_are_id_and_version, all_are_id_only, IdAndMaybeVersion, IdAndVersion, IdOnly } from "core/data/id"
import type { DataComponent } from "core/data/interface"
import type { GetSupabase } from "core/supabase"

import { update_data_component } from "../../../lib/core/src/data/write_to_db"
import { GetAppState, RootAppState, SetAppState } from "../interface"
import { AsyncDataComponent, DataComponentsState } from "./interface"


export function initial_state(set: SetAppState, get: GetAppState, get_supabase: GetSupabase): DataComponentsState
{
    return {
        data_component_ids_for_home_page: undefined,
        data_component_by_id_and_maybe_version: {},

        request_data_component_error: undefined,
        request_data_component: (data_component_id: IdAndMaybeVersion, force_reload?: boolean) =>
        {
            const async_data_components = get_or_create_async_data_components([data_component_id], set, get_supabase, force_reload)
            const async_data_component = async_data_components[0]
            if (!async_data_component)
            {
                throw new Error(`Exception, no async data component made for ID ${data_component_id.to_str()}`)
            }

            return async_data_component
        },

        request_data_components_for_home_page: () =>
        {
            request_data_components_for_home_page(set, get, get_supabase)
        },

        update_data_component: (data_component: DataComponent) =>
        {
            const id_only = data_component.id.to_str_without_version()
            let async_data_component: AsyncDataComponent

            set(state =>
            {
                const { data_component_by_id_and_maybe_version } = state.data_components

                async_data_component = {
                    id: data_component.id,
                    component: data_component,
                    status: "saving",
                    // Clear any previous error
                    error: undefined,
                }

                data_component_by_id_and_maybe_version[id_only] = async_data_component

                return state
            })

            attempt_to_update_data_component(data_component, set, get_supabase)

            return async_data_component!
        },
    }
}



function get_or_create_async_data_components(
    data_component_ids_to_load: IdAndMaybeVersion[],
    set_state: SetAppState,
    get_supabase: GetSupabase,
    force_reload?: boolean,
): AsyncDataComponent[]
{
    let async_data_components: AsyncDataComponent[]

    const actual_data_component_only_ids_to_load: IdOnly[] = []
    const actual_data_component_id_and_versions_to_load: IdAndVersion[] = []
    function add_id(id: IdAndMaybeVersion)
    {
        if (id instanceof IdOnly)
        {
            actual_data_component_only_ids_to_load.push(id)
        }
        else if (id instanceof IdAndVersion)
        {
            actual_data_component_id_and_versions_to_load.push(id)
        }
        else
        {
            throw new Error(`Unknown ID type: ${id}`)
        }
    }

    set_state(state =>
    {
        // Set the status of all requested data components to "loading"
        async_data_components = data_component_ids_to_load.map(id =>
        {
            const { data_component_by_id_and_maybe_version } = state.data_components
            const id_str = id.to_str()
            let async_data_component = data_component_by_id_and_maybe_version[id_str]

            if (!async_data_component)
            {
                async_data_component = {
                    id,
                    component: null,
                    status: "loading",
                }
                add_id(id)
            }
            // Allow it to retry if its status is error
            else if (async_data_component.status === "error")
            {
                // If the data component was previously in an error state, reset it to loading
                async_data_component.status = "loading"
                add_id(id)
            }
            else if (async_data_component.status === "not_found" && force_reload)
            {
                // If the data component was not found, and force_reload was true then try to load it again
                async_data_component.status = "loading"
                add_id(id)
            }

            data_component_by_id_and_maybe_version[id_str] = async_data_component

            return async_data_component
        })

        return state
    })

    load_data_components(actual_data_component_only_ids_to_load, set_state, get_supabase)
    load_data_components(actual_data_component_id_and_versions_to_load, set_state, get_supabase)

    return async_data_components!
}


async function load_data_components(
    data_component_ids_to_load: (IdOnly[]) | (IdAndVersion[]),
    set_state: SetAppState,
    get_supabase: GetSupabase,
)
{
    if (data_component_ids_to_load.length === 0) return
    // Request from supabase
    const response = all_are_id_only(data_component_ids_to_load)
        ? await request_data_components(get_supabase, {}, data_component_ids_to_load)
        : all_are_id_and_version(data_component_ids_to_load)
            ? await request_archived_data_components(get_supabase, data_component_ids_to_load)
            : (() => { throw new Error(`Invalid type, must be all IdOnly or all IdAndVersion: ${data_component_ids_to_load}`) })()

    set_state(state =>
    {
        if (response.error)
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
                // Leave component as it was in case we were refreshing an existing component
                // entry.component = null
            })
        }
        else
        {
            state = update_store_with_loaded_data_components(response.data, state, data_component_ids_to_load)
        }

        return state
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
            // Clear any previous error
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
                // Clear any previous error
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



async function request_data_components_for_home_page(
    set_state: SetAppState,
    get: GetAppState,
    get_supabase: GetSupabase,
)
{
    const { data_component_ids_for_home_page } = get().data_components

    if (data_component_ids_for_home_page?.status === "loading")
    {
        console. warn("Data components already loading, do not call request_data_components whilst loading")
        return
    }

    set_state(state =>
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

    const response = await request_data_components(get_supabase, { page: 0, size: 10 })

    set_state(state =>
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
}


async function attempt_to_update_data_component(
    data_component: DataComponent,
    set_state: SetAppState,
    get_supabase: GetSupabase,
)
{
    // Update the data component in the database
    const response = await update_data_component(get_supabase, data_component)

    set_state(state =>
    {
        const { data_component_by_id_and_maybe_version } = state.data_components
        const id_str = data_component.id.to_str()
        let async_data_component = data_component_by_id_and_maybe_version[id_str]

        if (!async_data_component)
        {
            console.error(`No placeholder found for data component with ID ${id_str}`)

            async_data_component = {
                id: data_component.id,
                component: data_component,
                status: "saving",
            }
        }

        if (response.error)
        {
            console.error("Error updating data component:", response.error)
            async_data_component.status = "error"
            async_data_component.error = `${response.error}`
            return state
        }

        // If the update was successful, update the component in the store
        async_data_component.status = "loaded"
        async_data_component.component = response.data
        async_data_component.error = undefined

        return state
    })
}
