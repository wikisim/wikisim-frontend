import { RootCoreState } from "core/state/interface"

import { DataComponentsState } from "./data_components/interface"
import { RouteState } from "./route/interface"
import { UIState } from "./ui_state/interface"
import { UsersState } from "./users/interface"


export interface RootAppState extends RootCoreState
{
    data_components: DataComponentsState
    route: RouteState
    users: UsersState
    ui: UIState
}

export type SetAppState = {
    (
        partial: RootAppState | Partial<RootAppState> | ((state: RootAppState) => void),
        replace?: false
    ): void
    (
        state: RootAppState | ((state: RootAppState) => void),
        replace: true
    ): void
}
export type GetAppState = () => RootAppState
