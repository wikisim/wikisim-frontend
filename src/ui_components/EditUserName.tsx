import { useCallback, useEffect, useRef, useState } from "preact/hooks"

import { ERRORS } from "core/errors"

import { app_store } from "../state/store"
import { TextEditorV1 } from "../text_editor/TextEditorV1"
import { debounce } from "../utils/debounce"
import Loading from "./Loading"


export function EditUserName()
{
    const state = app_store()
    const [user_name, _set_user_name] = useState(state.user_auth_session.user_name ?? "")

    const set_user_name = useCallback(debounce(_set_user_name, 400), [])

    return <div style={{ maxWidth: "250px" }}>
        <TextEditorV1
            editable={true}
            initial_content={user_name}
            on_change={e => set_user_name(e.currentTarget.value)}
            label="Your user name"
            start_focused="focused_and_text_selected"
            single_line={true}
        />

        <CheckUserNameAvailability user_name={user_name} />
    </div>
}



function CheckUserNameAvailability({ user_name }: { user_name: string })
{
    const trimmed_name = user_name.trim()
    const last_checked_name = useRef<string>(trimmed_name)

    const state = app_store()
    const [status, set_status] = useState<"initial" | "checking" | "error" | "success">("initial")
    const [error, set_error] = useState<string>("")

    const name_changed = last_checked_name.current !== trimmed_name


    useEffect(() =>
    {
        if (!name_changed)
        {
            set_status("initial")
            return
        }
        set_status("checking")
        state.user_auth_session.set_user_name(trimmed_name)
    }, [trimmed_name])


    useEffect(() =>
    {
        if (status !== "checking") return

        const { error_setting_user_name } = state.user_auth_session
        if (error_setting_user_name)
        {
            const err30 = error_setting_user_name.startsWith(ERRORS.ERR30.code)
            const err31 = error_setting_user_name.startsWith(ERRORS.ERR31.code)
            const err32 = error_setting_user_name.startsWith(ERRORS.ERR32.code)
            const users_ERR_dup_key = error_setting_user_name.startsWith(ERRORS.users_ERR_dup_key.message)

            if (err30) set_error("User name must be 4-32 characters long and only contain letters, numbers, and underscores")
            else if (err31) set_error("Sorry this user name is reserved and cannot be used")
            else if (err32) set_error("Sorry this user name partially matches a reserved name and cannot be used")
            else if (users_ERR_dup_key) set_error("This user name is already taken, please choose another")
            else set_error("Error setting user name, please try again later")

            set_status("error")
        }
        else if (state.user_auth_session.user_name === trimmed_name)
        {
            set_status("success")
            last_checked_name.current = trimmed_name
        }
    }, [
        state.user_auth_session.error_setting_user_name,
        state.user_auth_session.user_name,
    ])


    if (status === "initial") return null
    else if (status === "checking") return <div>Checking<Loading /></div>
    else if (status === "error") return <div className="generic-error-message warning">{error}</div>
    else return <div style={{ color: "var(--colour-success)" }}>User name set!</div>
}
