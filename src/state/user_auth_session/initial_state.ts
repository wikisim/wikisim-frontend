import { SetType } from "../interface"
import { AppUser, UserAuthSessionState } from "./interface"


export default function initial_state(set: SetType): UserAuthSessionState
{
    return {
        user: null,
        isLoggedIn: false,
        login: (user: AppUser) => set(root_state => {
            root_state.user_auth_session.user = user
            root_state.user_auth_session.isLoggedIn = true
            return root_state
        }),
        logout: () => set(root_state => {
            root_state.user_auth_session.user = null
            root_state.user_auth_session.isLoggedIn = false
            return root_state
        }),
    }
}
