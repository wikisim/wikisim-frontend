import { DataComponentsState } from "./data_components/interface"
import { UserAuthSessionState } from "./user_auth_session/interface"


export interface RootState
{
    data_components: DataComponentsState
    user_auth_session: UserAuthSessionState
}

export type SetType = {
    (
        partial: RootState | Partial<RootState> | ((state: RootState) => RootState | Partial<RootState>),
        replace?: false
    ): void;
    (
        state: RootState | ((state: RootState) => RootState),
        replace: true
    ): void
}
export type GetType = () => RootState
