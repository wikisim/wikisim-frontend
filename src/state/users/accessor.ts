import { RootAppState } from "../interface"
import { AsyncUser } from "./interface"


export function get_async_user(state: RootAppState, user_id: string): AsyncUser
{
    const { user_by_id } = state.users

    let user = user_by_id[user_id]

    if (!user)
    {
        // console .debug(`User with ID ${user_id} not found.  Requesting to load it.`)
        user = state.users.request_user(user_id)
    }

    return user
}
