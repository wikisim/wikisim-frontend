
export interface AppUser
{
    id: string
    name: string
    email: string
}

export interface UserAuthSessionState
{
    user: AppUser | null
    isLoggedIn: boolean
    login: (user: AppUser) => void
    logout: () => void
}
