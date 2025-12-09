import { ActionIcon } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import IconCloudX from "@tabler/icons-react/dist/esm/icons/IconCloudX"
import IconX from "@tabler/icons-react/dist/esm/icons/IconX"
import { useEffect, useRef } from "preact/hooks"

import { RootAppState } from "../../state/interface"
import { local_storage } from "../../state/local_storage"
import { app_store } from "../../state/store"


interface NotificationElementIdsMap
{
    user_session_error?: string
    known_error?: string
}

const close_in = 10 // seconds

export function InfoAndErrorMessagesDisplay()
{

    const state = app_store()
    const user_session_error = state.user_auth_session.error

    const notification_element_ids = useRef<NotificationElementIdsMap>({})

    useEffect(() =>
    {
        // Close existing notification
        hide(notification_element_ids.current.user_session_error)

        if (!user_session_error) return

        notification_element_ids.current.user_session_error = show_user_session_error_notification(close_in)
    }, [user_session_error])


    useEffect(() =>
    {
        // known_error is a constant in this file so we can do this conditional
        // check first
        if (!known_error) return

        // Close existing notification
        hide(notification_element_ids.current.known_error)

        notification_element_ids.current.known_error = show_known_error_notification(known_error, state, close_in)
    }, [known_error, state])

    return null
}


function show_user_session_error_notification(close_in: number)
{
    return notifications.show({
        title: "Error loading user session",
        message: (<div className="notifcation-user-session-error">
            There was an error loading your user session.  Attempting to reload...
        </div>),
        color: "var(--mantine-color-red-9)", // : "var(--colour-primary-blue)",
        position: "top-center",
        autoClose: close_in * 1000,
        withCloseButton: true,
        withBorder: true,
        icon: <IconCloudX />,
    })
}


function hide(id: string | undefined)
{
    if (id) notifications.hide(id)
}


interface KnownError
{
    /**
     * Can increment this id for the same error if you want to show it again to
     * users who have dismissed it previously.
     */
    id: number
    severity: "low" | "high"
    title: string
    message: string
    start_datetime: Date
    issue_url?: string
    conditional_display?: (state: RootAppState) => boolean
}

const known_error: KnownError | undefined = {
    id: 1,
    severity: "low",
    title: "Partial outage affecting interactable component uploads",
    message: "We are investigating an issue where users are unable to upload files for interactable components.",
    start_datetime: new Date("2025-12-09T08:15:00Z"),
    issue_url: "https://github.com/wikisim/wikisim-frontend/issues/20",
    conditional_display: (state: RootAppState) =>
    {
        return state.route.current_path_is_edit_page || state.route.current_path_is_create_page
    },
}

function show_known_error_notification(known_error: KnownError, state: RootAppState, close_in: number)
{
    const dismissed = local_storage.get_known_error_dismissed(known_error.id)
    if (dismissed) return undefined

    if (known_error.conditional_display && !known_error.conditional_display(state)) return undefined

    const notification_id = notifications.show({
        title: known_error.title,
        message: (<div className="notification-known-error">
            {known_error.message}
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "8px", cursor: "pointer" }}>
                {known_error.issue_url && <a href={known_error.issue_url} target="_blank" rel="noreferrer">
                    View issue details
                </a>}
                <div style={{ display: "flex", alignItems: "center" }} onClick={() =>
                {
                    local_storage.set_known_error_dismissed(known_error.id)
                    hide(notification_id)
                }}>
                    Dismiss <ActionIcon variant="subtle" size="sm"><IconX /></ActionIcon>
                </div>
            </div>
        </div>),
        color: known_error.severity === "high" ? "var(--mantine-color-red-9)" : "var(--mantine-color-yellow-9)",
        position: known_error.severity === "high" ? "top-center" : "bottom-right",
        autoClose: close_in * 1000,
        withCloseButton: false,
        withBorder: true,
        icon: <IconCloudX />,
    })

    return notification_id
}
