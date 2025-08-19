import { request_archived_data_components, request_data_components } from "core/data/fetch_from_db"
import { all_are_id_and_version, all_are_id_only, IdAndMaybeVersion, IdAndVersion, IdOnly } from "core/data/id"
import type { DataComponent, NewDataComponent } from "core/data/interface"
import { insert_data_component, update_data_component } from "core/data/write_to_db"
import type { GetSupabase } from "core/supabase"

import { GetAppState, RootAppState, SetAppState } from "../interface"
import { AsyncDataComponent, AsyncNewDataComponent, DataComponentsState, UpsertDataComponentResult } from "./interface"


export function initial_state(set: SetAppState, get: GetAppState, get_supabase: GetSupabase): DataComponentsState
{
    return {
        data_component_ids_for_home_page: undefined,
        data_component_by_id_and_maybe_version: {},

        request_data_component_error: undefined,
        request_data_component: (data_component_id: IdAndMaybeVersion, force_refresh?: boolean) =>
        {
            const async_data_components = get_or_create_async_data_components([data_component_id], set, get_supabase, force_refresh)
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

        request_data_component_history: (data_component_id: IdOnly, page: number, page_size: number, force_refresh?: boolean) =>
        {
            request_data_component_history(set, get_supabase, data_component_id, page, page_size, force_refresh)
        },

        update_data_component: (data_component: DataComponent) =>
        {
            return attempt_to_update_data_component(data_component, set, get_supabase)
        },

        new_data_component_by_temp_id: {},
        insert_data_component: (data_component: NewDataComponent) =>
        {
            return attempt_to_insert_data_component(data_component, set, get_supabase)
        },
    }
}



/**
 * This does not create a new data component in the DB, it just creates a new
 * async data component _placeholder_ in the store and then tries to load it
 * from the DB though this will fail if the data component does not exist (or
 * some kind of error is encountered).
 */
function get_or_create_async_data_components(
    data_component_ids_to_load: IdAndMaybeVersion[],
    set_state: SetAppState,
    get_supabase: GetSupabase,
    force_refresh?: boolean,
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
            else if (async_data_component.status === "not_found" && force_refresh)
            {
                // If the data component was not found, and force_refresh was true then try to load it again
                async_data_component.status = "loading"
                add_id(id)
            }
            // This allows us to refresh a data component to check if there is a
            // newer version of it available.
            else if (async_data_component.status === "loaded" && force_refresh && id instanceof IdOnly)
            {
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
        ? await request_data_components(get_supabase, { ids: data_component_ids_to_load })
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
                entry.error = response.error
                // Leave component as it was in case we were refreshing an existing component
                // entry.component = null
            })
        }
        else
        {
            mutate_store_state_with_loaded_data_components(response.data, state, data_component_ids_to_load)
        }

        return state
    })
}


export function mutate_store_state_with_loaded_data_components(
    data: DataComponent[],
    state: RootAppState,
    expected_ids: IdAndMaybeVersion[] = [],
): void
{
    const expected_ids_to_load: Set<string> = new Set(expected_ids.map(id => id.to_str()))

    data.forEach(instance =>
    {
        const id_and_version_str = instance.id.to_str()
        const id_only_str = instance.id.to_str_without_version()

        // For each entry, find it's placeholder in `data_components_by_id_only`
        // and update it with the loaded data component
        const { data_component_by_id_and_maybe_version } = state.data_components
        data_component_by_id_and_maybe_version[id_and_version_str] = {
            id: instance.id,
            component: instance,
            status: "loaded",
            // Clear any previous error
            error: undefined,
        }

        const id_only_instance = data_component_by_id_and_maybe_version[id_only_str]?.component
        if (!id_only_instance || id_only_instance.id.version <= instance.id.version)
        {
            // If the ID without version is not present, or the version is earlier
            // than the one we just loaded, the upsert it to our local store
            data_component_by_id_and_maybe_version[id_only_str] = {
                id: instance.id,
                component: instance,
                status: "loaded",
                // Clear any previous error
                error: undefined,
            }
        }

        expected_ids_to_load.delete(id_and_version_str)
        expected_ids_to_load.delete(id_only_str)
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
        console .warn("Data components already loading, do not call request_data_components whilst loading")
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
            data_component_ids_for_home_page.error = response.error
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
            mutate_store_state_with_loaded_data_components(response.data, state)
        }

        state.data_components.data_component_ids_for_home_page = data_component_ids_for_home_page
        return state
    })
}


function request_data_component_history(
    set_state: SetAppState,
    get_supabase: GetSupabase,
    data_component_id: IdOnly,
    page: number,
    page_size: number,
    force_refresh?: boolean,
): void
{
    set_state(state =>
    {
        const { data_component_by_id_and_maybe_version } = state.data_components
        const id_str = data_component_id.to_str()
        let async_data_component = data_component_by_id_and_maybe_version[id_str]

        if (async_data_component)
        {
            // If the async data component already exists, we can just update its status
            if (async_data_component.status === "error" || force_refresh)
            {
                async_data_component.status = "loading"
                async_data_component.error = undefined
            }
        }
        else
        {
            // Otherwise, create a new one
            async_data_component = {
                id: data_component_id,
                component: null,
                status: "loading",
            }
        }
        data_component_by_id_and_maybe_version[id_str] = async_data_component

        return state
    })

    process_request_data_component_history(
        set_state,
        get_supabase,
        data_component_id,
        page,
        page_size,
    )
}


async function process_request_data_component_history(
    set_state: SetAppState,
    get_supabase: GetSupabase,
    data_component_id: IdOnly,
    page: number,
    page_size: number,
)
{
    // Request the data component history from the database
    const size = page_size * 2  // get two pages worth of data
    const response = await request_archived_data_components(get_supabase, [data_component_id], { page, size })

    set_state(state =>
    {
        if (response.error)
        {
            const id_str = data_component_id.to_str()
            const { data_component_by_id_and_maybe_version } = state.data_components
            const async_data_component = (
                data_component_by_id_and_maybe_version[id_str]
                // Provide default if not found, but should always be present
                || { id: data_component_id, component: null, status: "loading" }
            )
            async_data_component.status = "error"
            async_data_component.error = response.error

            data_component_by_id_and_maybe_version[id_str] = async_data_component

            return state
        }
        // This handles the edge case where someone manually chooses a page
        // that has no data as the first request to the history page they are
        // viewing, i.e. they go straight to /wiki/1/history?page=2000 instead
        // of going via /wiki/1/history?page=1 etc.
        else if (response.data.length === 0)
        {
            const id_str = data_component_id.to_str()
            const { data_component_by_id_and_maybe_version } = state.data_components
            const async_data_component = (
                data_component_by_id_and_maybe_version[id_str]
                // Provide default if not found, but should always be present
                || { id: data_component_id, component: null, status: "loading" }
            )
            async_data_component.status = "not_found"
            async_data_component.error = undefined

            data_component_by_id_and_maybe_version[id_str] = async_data_component
            return state
        }
        mutate_store_state_with_loaded_data_components(response.data, state)

        return state
    })
}


async function attempt_to_update_data_component(
    data_component: DataComponent,
    set_state: SetAppState,
    get_supabase: GetSupabase,
): Promise<UpsertDataComponentResult>
{
    set_state(state =>
    {
        const { data_component_by_id_and_maybe_version } = state.data_components

        const async_data_component: AsyncDataComponent = {
            id: data_component.id,
            component: data_component,
            status: "saving",
            // Clear any previous error
            error: undefined,
        }

        const id_only = data_component.id.to_str_without_version()
        data_component_by_id_and_maybe_version[id_only] = async_data_component

        return state
    })

    // Update the data component in the database
    const response = await update_data_component(get_supabase, data_component)

    let result: UpsertDataComponentResult

    set_state(state =>
    {
        const { data_component_by_id_and_maybe_version } = state.data_components

        if (response.error)
        {
            result = { error: response.error, id: undefined }
            console.error("Error updating data component:", response.error)
            const id_str = data_component.id.to_str_without_version()

            const async_data_component: AsyncDataComponent = {
                id: data_component.id,
                component: data_component,
                status: "error",
                error: response.error,
            }

            data_component_by_id_and_maybe_version[id_str] = async_data_component
            return state
        }

        result = { error: undefined, id: response.data.id }
        mutate_store_state_with_loaded_data_components([response.data], state)

        return state
    })

    return result!
}



async function attempt_to_insert_data_component(
    data_component: NewDataComponent,
    set_state: SetAppState,
    get_supabase: GetSupabase,
): Promise<UpsertDataComponentResult>
{
    set_state(state =>
    {
        const async_data_component: AsyncNewDataComponent = {
            temporary_id: data_component.temporary_id,
            new_id: undefined,
            status: "saving",
            error: undefined,
        }
        const id_str = data_component.temporary_id.to_str()

        state.data_components.new_data_component_by_temp_id[id_str] = async_data_component

        return state
    })

    // Insert the data component in the database
    const response = await insert_data_component(get_supabase, data_component)

    let result: UpsertDataComponentResult

    set_state(state =>
    {
        const id_str = data_component.temporary_id.to_str()
        const async_data_component = state.data_components.new_data_component_by_temp_id[id_str]!

        if (response.error)
        {
            result = { error: response.error, id: undefined }
            console.error("Error updating data component:", response.error)
            async_data_component.status = "error"
            async_data_component.error = response.error
            return state
        }

        result = { error: undefined, id: response.data.id }
        // If the insert was successful, insert the component in the store
        mutate_store_state_with_loaded_data_components([response.data], state)

        // And update the async new data component placeholder with status and ID
        async_data_component.status = "loaded"
        async_data_component.new_id = response.data.id
        async_data_component.error = undefined

        return state
    })

    return result!
}
