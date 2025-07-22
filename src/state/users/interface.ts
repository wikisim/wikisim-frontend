

export interface User
{
    id: string
    name: string
}


type BasicLoadingStatus = "loading" | "error" | "loaded"
type LoadingStatus = "requested" | BasicLoadingStatus | "not_found"
export interface AsyncUser
{
    id: string
    user: User | null
    status: LoadingStatus
    error?: Error
}

export interface UsersState
{
    user_ids_to_load: string[]
    user_by_id: Record<string, AsyncUser>

    request_user_error: Error | undefined
    request_user: (user_id: string) => AsyncUser
}
