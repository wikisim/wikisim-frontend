import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

import { RootState } from "./root_state"
import { initial_state as initial_state_user_auth_session } from "./user_auth_session/user_auth_session"



export const get_store = create<RootState>()(immer((set) => ({
    user_auth_session: initial_state_user_auth_session(set),

    currentSection: null,
    setCurrentSection: (section) => set({ currentSection: section }),
})))
