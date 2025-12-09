import { SetAppState } from "../interface"
import type { RouteState } from "./interface"


export function initial_state(set_state: SetAppState): RouteState
{
    return {
        current_path: window.location.pathname,
        set_route: (new_path: string) =>
        {
            set_state(state =>
            {
                state.route.current_path = new_path
            })
        },
    }
}
