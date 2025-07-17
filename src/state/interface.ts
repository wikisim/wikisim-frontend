import { RootCoreState } from "core/state/interface"

import { DataComponentsState } from "./data_components/interface"


export interface RootAppState extends RootCoreState
{
    data_components: DataComponentsState
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
