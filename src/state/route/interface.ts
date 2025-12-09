

export interface RouteState
{
    current_path: string
    current_path_is_edit_page: boolean
    current_path_is_create_page: boolean
    set_route: (path: string) => void
}
