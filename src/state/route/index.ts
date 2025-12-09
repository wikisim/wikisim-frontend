import { ROUTES } from "../../routes"
import { SetAppState } from "../interface"
import type { RouteState } from "./interface"


export function initial_state(set_state: SetAppState): RouteState
{
    return {
        set_route: (new_path: string) =>
        {
            set_state(state =>
            {
                state.route = {
                    ...state.route,
                    ...handle_route_change(new_path),
                }
            })
        },
        ...handle_route_change(window.location.pathname),
    }
}

function handle_route_change(new_path: string): Omit<RouteState, "set_route">
{
    const edit_route = ROUTES.DATA_COMPONENT.EDIT(":data_component_id").replace(":data_component_id", "")
    return {
        current_path: new_path,
        current_path_is_edit_page: new_path.startsWith(edit_route),
        current_path_is_create_page: new_path.startsWith(ROUTES.DATA_COMPONENT.NEW()),
    }
}
