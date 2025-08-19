import { RootCoreState } from "core/state/interface"

import { DataComponentsState } from "./data_components/interface"
import { UIState } from "./ui_state/interface"
import { UsersState } from "./users/interface"


export interface RootAppState extends RootCoreState
{
    data_components: DataComponentsState
    users: UsersState
    ui: UIState
}

export type SetAppState = {
    (
        partial: RootAppState | Partial<RootAppState> | ((state: RootAppState) => RootAppState | Partial<RootAppState>),
        replace?: false
    ): void
    (
        state: RootAppState | ((state: RootAppState) => RootAppState),
        replace: true
    ): void
}
export type GetAppState = () => RootAppState
