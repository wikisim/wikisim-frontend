import { UserAuthSessionState } from "./user_auth_session/state"


export interface RootState
{
    user_auth_session: UserAuthSessionState

    // UI state
    currentSection: string | null
    setCurrentSection: (section: string) => void
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
