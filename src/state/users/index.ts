import type { GetSupabase } from "core/supabase/browser"

import { is_uuid_v4 } from "../../utils/is_uuid_v4"
import type { GetAppState, RootAppState, SetAppState } from "../interface"
import { request_users } from "./fetch_from_db"
import type { User, UsersState } from "./interface"
import { sanitise_user_id_or_name } from "./sanitise_user_id_or_name"


export function initial_state(set_state: SetAppState, get_state: GetAppState, get_supabase: GetSupabase): UsersState
{
    return {
        user_ids_or_names_to_load: [],
        user_by_id_or_lowercased_name: {},

        request_user_error: undefined,
        request_user: (user_id_or_name: string) =>
        {
            user_id_or_name = sanitise_user_id_or_name(user_id_or_name)

            const { user_by_id_or_lowercased_name } = get_state().users

            let async_user = user_by_id_or_lowercased_name[user_id_or_name]

            if (!async_user)
            {
                // console .debug(`user with ID ${user_id} not found.  Requesting to load it.`)

                const id = is_uuid_v4(user_id_or_name) ? user_id_or_name : ""
                // If it is not a valid UUID v4, then we assume it is a user
                // name, though is is provided by user is might be incorrect
                const lowercased_name = id === "" ? user_id_or_name : ""

                async_user = {
                    id,
                    lowercased_name,
                    user: null,
                    status: "requested",
                }

                set_state(state =>
                {
                    state.users.user_ids_or_names_to_load.push(user_id_or_name)
                    state.users.user_by_id_or_lowercased_name[user_id_or_name] = async_user!
                })

                setTimeout(() => load_requested_users(set_state, get_supabase), 0)
            }

            return async_user
        },
    }
}



async function load_requested_users(
    set_state: SetAppState,
    get_supabase: GetSupabase,
)
{
    let user_ids_or_names_to_load: string[]

    set_state(state =>
    {
        user_ids_or_names_to_load = [...state.users.user_ids_or_names_to_load]
        // If there are no users to request, return early, otherwise trigger a load
        if (user_ids_or_names_to_load.length === 0) return

        // Set the status of all requested users to "loading"
        user_ids_or_names_to_load.forEach(user_id_or_name =>
        {
            const { user_by_id_or_lowercased_name } = state.users
            const entry = user_by_id_or_lowercased_name[user_id_or_name]

            // type guard, should not happen
            if (!entry) throw new Error(`Exception: No placeholder found for user with ID or name "${user_by_id_or_lowercased_name}"`)
            entry.status = "loading"
            // Leave user as it is.  Perhaps we might be refreshing an existing user?
            // entry.user = null
        })

        state.users.user_ids_or_names_to_load = []
    })

    // Request from supabase
    const response = await request_users(get_supabase, user_ids_or_names_to_load!)

    set_state(state =>
    {
        if (response.error)
        {
            state.users.request_user_error = response.error

            user_ids_or_names_to_load.forEach(user_id_or_name =>
            {
                const { user_by_id_or_lowercased_name } = state.users
                const entry = user_by_id_or_lowercased_name[user_id_or_name]

                // type guard, should not happen
                if (!entry) throw new Error(`Exception: No placeholder found for user with ID or name ${user_id_or_name}`)
                entry.status = "error"
                entry.error = response.error
                // entry.user = null // Leave user as it was in case we were refreshing an existing user
            })
        }
        else
        {
            update_store_with_loaded_users(response.data, state, new Set(user_ids_or_names_to_load))
        }
    })
}


function update_store_with_loaded_users(
    data: User[],
    state: RootAppState,
    expected_ids_or_names_to_load: Set<string>,
)
{
    data.forEach(user =>
    {
        const user_name_lowercased = user.name.toLowerCase()

        // For each entry, find it's placeholder in `users_by_id_only`
        // and update it with the loaded user
        const { user_by_id_or_lowercased_name } = state.users
        user_by_id_or_lowercased_name[user.id] = user_by_id_or_lowercased_name[user_name_lowercased] = {
            id: user.id,
            lowercased_name: user_name_lowercased,
            user: user,
            status: "loaded",
            error: undefined,
        }

        expected_ids_or_names_to_load.delete(user.id)
        expected_ids_or_names_to_load.delete(user_name_lowercased)
    })

    expected_ids_or_names_to_load.forEach(id_or_name =>
    {
        // If there are any IDs that were expected to be loaded but were not found,
        // we set their status to "not_found"
        const { user_by_id_or_lowercased_name } = state.users
        const entry = user_by_id_or_lowercased_name[id_or_name]
        // type guard, should not happen
        if (!entry) throw new Error(`Exception: No placeholder found for user with ID or name "${id_or_name}"`)

        entry.status = "not_found"
        entry.user = null
    })
}
