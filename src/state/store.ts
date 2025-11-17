import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

import { CoreStoreDependencies, get_new_core_store } from "core/state/store"
import { get_supabase } from "core/supabase/browser"
import { deep_freeze } from "core/utils/deep_freeze"

import { deep_copy } from "../utils/deep_copy"
import * as data_components from "./data_components"
import { RootAppState } from "./interface"
import * as ui_state from "./ui_state"
import * as users from "./users"


export type AppStore = ReturnType<typeof get_new_app_store>

type AppStoreDependencies = CoreStoreDependencies

function default_dependencies(): AppStoreDependencies
{
    return {
        get_supabase,
    }
}

// Wrapped the Zustand store creation in a function to allow for testing and
// resetting.
// This allows us to create a fresh store instance for each test or reset
// without affecting the global state.
export const get_new_app_store = (dependencies?: AppStoreDependencies) =>
{
    dependencies = dependencies || default_dependencies()

    const core_store = get_new_core_store(dependencies)

    const app_store = create<RootAppState>()(immer((set_state, get_state) =>
    {
        return {
            data_components: data_components.initial_state(set_state, get_state, dependencies.get_supabase),
            debugging: core_store.getState().debugging,
            user_auth_session: core_store.getState().user_auth_session,
            users: users.initial_state(set_state, get_state, dependencies.get_supabase),
            ui: ui_state.initial_state(set_state),
        }
    }))

    core_store.subscribe((core_state, _previous_core_state) =>
    {
        app_store.setState({
            user_auth_session: core_state.user_auth_session,
        })
    })

    // Expose the store state for easier debugging
    app_store.subscribe((state, _previous_state) =>
    {
        // Don't run this in a non-browser environment
        if (typeof window === "undefined") return
        const debug_state = deep_copy(state)
        const all_debug_state = {
            ...debug_state,
            by_id: debug_state.data_components.data_component_by_id_and_maybe_version,
        }
        ;(window as any).debug_state = deep_freeze(all_debug_state)
    })

    return app_store
}


// Wrapped the store in a function to allow for lazy initialization.
// This allows us to create the store only when it's needed, which allows us to
// stub out the calls to supabase in tests.
let _app_store: AppStore | undefined = undefined
export const app_store = () =>
{
    if (_app_store) return _app_store()
    _app_store = get_new_app_store()

    return _app_store()
}
