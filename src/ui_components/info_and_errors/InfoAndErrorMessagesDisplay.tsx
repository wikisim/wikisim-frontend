import { notifications } from "@mantine/notifications"
import IconCloudX from "@tabler/icons-react/dist/esm/icons/IconCloudX"
import { useEffect, useRef } from "preact/hooks"

import { app_store } from "../../state/store"


export function InfoAndErrorMessagesDisplay()
{
    const close_in = 10 // seconds

    const state = app_store()
    const user_session_error = state.user_auth_session.error

    const notification_element_id = useRef<string | undefined>(undefined)

    useEffect(() =>
    {
        // Close any existing notification
        if (notification_element_id.current)
        {
            notifications.hide(notification_element_id.current)
        }

        if (!user_session_error) return

        notification_element_id.current = show_user_session_error_notification(close_in)
    }, [user_session_error])
    console.log("user_session_error:", user_session_error)

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
