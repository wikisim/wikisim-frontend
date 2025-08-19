
import { SetAppState } from "../interface"
import { UIState } from "./interface"


export function initial_state(set: SetAppState): UIState
{
    return {
        show_log_in_modal: false,
        set_show_log_in_modal: (show: boolean) =>
        {
            set(state =>
            {
                state.ui.show_log_in_modal = show
                return state
            })
        },
        toggle_show_log_in_modal: () =>
        {
            set(state =>
            {
                state.ui.show_log_in_modal = !state.ui.show_log_in_modal
                return state
            })
        },
    }
}
