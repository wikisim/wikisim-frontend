
import { SetAppState } from "../interface"
import { UIState } from "./interface"


export function initial_state(set_state: SetAppState): UIState
{
    return {
        show_log_in_modal: false,
        set_show_log_in_modal: (show: boolean) =>
        {
            set_state(state =>
            {
                state.ui.show_log_in_modal = show
            })
        },
        toggle_show_log_in_modal: () =>
        {
            set_state(state =>
            {
                state.ui.show_log_in_modal = !state.ui.show_log_in_modal
            })
        },
    }
}
