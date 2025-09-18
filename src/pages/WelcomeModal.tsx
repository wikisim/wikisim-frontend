import { Button, Modal, Text } from "@mantine/core"
import { useRef, useState } from "preact/hooks"

import { app_store } from "../state/store"
import { EditUserName } from "../ui_components/EditUserName"


export function WelcomeModal()
{
    const state = app_store()
    const [model_open, set_model_open] = useState(true)

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

        <EditUserName />

        {user_name_set && <Button
            onClick={() => set_model_open(false)}
            style={{ marginTop: "1em" }}
        >Continue to WikiSim</Button>}

        <div className="vertical-gap" />

    </Modal>
}
