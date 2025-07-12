import { create, StoreApi, UseBoundStore } from "zustand"
import { immer } from "zustand/middleware/immer"

import * as data_components from "./data_components"
import { RootState } from "./interface"
import initial_state_user_auth_session from "./user_auth_session/initial_state"


export type AppStore = UseBoundStore<StoreApi<RootState>>

// Wrapped the Zustand store creation in a function to allow for testing and
// resetting.
// This allows us to create a fresh store instance for each test or reset
// without affecting the global state.
export const get_new_app_store = () =>
{
    const app_store = create<RootState>()(immer((set, get) => ({
        data_components: data_components.initial_state(set, get),
        user_auth_session: initial_state_user_auth_session(set),
    })))

    data_components.subscriptions(app_store)

    return app_store
}

export const app_store = get_new_app_store()
