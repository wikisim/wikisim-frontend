import { Button, Modal, Text } from "@mantine/core"
import { useEffect, useMemo, useRef, useState } from "preact/hooks"

import { ERRORS } from "core/errors"

import { app_store } from "../state/store"
import { TextEditorV1 } from "../text_editor/TextEditorV1"
import Loading from "../ui_components/Loading"
import { debounce } from "../utils/debounce"


export function WelcomeModal()
{
    const state = app_store()
    const [model_open, set_model_open] = useState(true)
    const [user_name, _set_user_name] = useState(state.user_auth_session.user_name ?? "")

    const set_user_name = useMemo(() => debounce(_set_user_name, 1000), [])
    const showed_form_once = useRef(false)

    const { user_name_set } = state.user_auth_session
    if (!showed_form_once.current && (user_name_set === undefined || user_name_set === true)) return null
    showed_form_once.current = true

    return <Modal
        withCloseButton={!!user_name_set} // Only show close button when user_name_set is true
        opened={model_open}
        onClose={() => {
            if (user_name_set) set_model_open(false)
        }}
        title=""
        zIndex="var(--z-index-modal-welcome)"
        size="lg"
    >
        <h1>Welcome to WikiSim</h1>

        <div className="vertical-gap" />

        <p style={{ display: "flex", flexDirection: "row", gap: "0.5em", alignItems: "center" }}>
            Please set a user name <Text c="dimmed" size="sm">
                (you can change this later)
            </Text>
        </p>

        <div style={{ maxWidth: "250px" }}>
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

        {user_name_set && <Button
            onClick={() => set_model_open(false)}
            style={{ marginTop: "1em" }}
        >Continue to WikiSim</Button>}

        <div className="vertical-gap" />

    </Modal>
}


function CheckUserNameAvailability({ user_name }: { user_name: string })
{
    const trimmed_name = user_name.trim()
    const last_checked_name = useRef<string>(trimmed_name)

    const state = app_store()
    const [status, set_status] = useState<"initial" | "checking" | "error" | "success">("initial")
    const [error, set_error] = useState<string>("")

    const name_changed_once = useRef(false)
    const name_changed = last_checked_name.current !== trimmed_name

    console.log("CheckUserNameAvailability render", { user_name, trimmed_name, last_checked_name: last_checked_name.current, name_changed, status, error })

    if (!name_changed_once.current && !name_changed) return null
    name_changed_once.current = true

    useEffect(() =>
    {
        set_status("checking")
        state.user_auth_session.set_user_name(trimmed_name)
    }, [trimmed_name])


    useEffect(() =>
    {
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
        else if (state.user_auth_session.user_name_set)
        {
            set_status("success")
            last_checked_name.current = trimmed_name
        }
    }, [state.user_auth_session])


    if (status === "initial") return null
    else if (status === "checking") return <div>Checking<Loading /></div>
    else if (status === "error") return <div className="generic-error-message warning">{error}</div>
    else return <div style={{ color: "var(--colour-success)" }}>User name set!</div>
}
