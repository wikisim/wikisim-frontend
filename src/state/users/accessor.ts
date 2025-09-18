import { RootAppState } from "../interface"
import { AsyncUser } from "./interface"
import { sanitise_user_id_or_name } from "./sanitise_user_id_or_name"


export function get_async_user(state: RootAppState, user_id_or_name: string): AsyncUser
{
    const { user_by_id_or_lowercased_name } = state.users

    user_id_or_name = sanitise_user_id_or_name(user_id_or_name)

    let user = user_by_id_or_lowercased_name[user_id_or_name]

    if (!user)
    {
        // console .debug(`User with ID ${user_id} not found.  Requesting to load it.`)
        user = state.users.request_user(user_id_or_name)
    }

    return user
}
