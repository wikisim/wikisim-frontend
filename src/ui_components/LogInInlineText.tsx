import { app_store } from "../state/store"


export function LogInInlineText()
{
    const { ui } = app_store()
    const { set_show_log_in_modal } = ui
    return <a href="" onPointerDown={() => set_show_log_in_modal(true)}>log in</a>
}
