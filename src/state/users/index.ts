import type { GetSupabase } from "core/supabase"

import { GetAppState, RootAppState, SetAppState } from "../interface"
import { request_users } from "./fetch_from_db"
import { User, UsersState } from "./interface"


export function initial_state(set: SetAppState, get: GetAppState, get_supabase: GetSupabase): UsersState
{
    return {
        user_ids_to_load: [],
        user_by_id: {},

        request_user_error: undefined,
        request_user: (user_id: string) =>
        {
            const { user_by_id } = get().users

            let async_user = user_by_id[user_id]

            if (!async_user)
            {
                // console .debug(`user with ID ${user_id} not found.  Requesting to load it.`)

                async_user = {
                    id: user_id,
                    user: null,
                    status: "requested",
                }

                set(state =>
                {
                    state.users.user_ids_to_load.push(user_id)
                    state.users.user_by_id[user_id] = async_user!

                    return state
                })

                setTimeout(() => load_requested_users(set, get_supabase), 0)
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
    let user_ids_to_load: string[]

    set_state(state =>
    {
        user_ids_to_load = [...state.users.user_ids_to_load]
        // If there are no users to request, return early, otherwise trigger a load
        if (user_ids_to_load.length === 0) return state

        // Set the status of all requested users to "loading"
        user_ids_to_load.forEach(user_id =>
        {
            const { user_by_id } = state.users
            const entry = user_by_id[user_id]
            // type guard, should not happen
            if (!entry) throw new Error(`Exception: No placeholder found for user with ID ${user_id}`)
            entry.status = "loading"
            // Leave user as it is.  Perhaps we might be refreshing an existing user?
            // entry.user = null
        })

        state.users.user_ids_to_load = []
        return state
    })

    // Request from supabase
    const response = await request_users(get_supabase, user_ids_to_load!)

    set_state(state =>
    {
        if (response.error)
        {
            state.users.request_user_error = response.error

            user_ids_to_load.forEach(id =>
            {
                const { user_by_id } = state.users
                const entry = user_by_id[id]
                // type guard, should not happen
                if (!entry) throw new Error(`Exception: No placeholder found for user with ID ${id}`)
                entry.status = "error"
                entry.error = response.error
                // entry.user = null // Leave user as it was in case we were refreshing an existing user
            })

            return state
        }

        return update_store_with_loaded_users(response.data, state, user_ids_to_load)
    })
}


function update_store_with_loaded_users(
    data: User[],
    state: RootAppState,
    expected_ids: string[] = [],
): RootAppState
{
    const expected_ids_to_load: Set<string> = new Set(expected_ids)

    data.forEach(user =>
    {
        // For each entry, find it's placeholder in `users_by_id_only`
        // and update it with the loaded user
        const { user_by_id } = state.users
        user_by_id[user.id] = {
            id: user.id,
            user: user,
            status: "loaded",
            error: undefined,
        }

        expected_ids_to_load.delete(user.id)
    })

    expected_ids_to_load.forEach(id =>
    {
        // If there are any IDs that were expected to be loaded but were not found,
        // we set their status to "not_found"
        const { user_by_id } = state.users
        const entry = user_by_id[id]
        // type guard, should not happen
        if (!entry) throw new Error(`Exception: No placeholder found for user with ID ${id}`)

        entry.status = "not_found"
        entry.user = null
    })

    return state
}
