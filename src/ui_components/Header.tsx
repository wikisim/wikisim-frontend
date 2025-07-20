import IconUser from "@tabler/icons-react/dist/esm/icons/IconUser"

import { Button, Modal, TextInput } from "@mantine/core"
import { h } from "preact"
import { useEffect, useState } from "preact/hooks"
import { app_store } from "../state/store"
import "./Header.css"
import Loading from "./Loading"


export default function Header() {
    return (
        <header className="header-bar">
            <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
                <h1 style={{ lineHeight: 0, padding: "0 10px" }}>
                    WikiSim
                </h1>
            </a>
            <nav className="right">
                <UserSession />
            </nav>
        </header>
    )
}


function UserSession()
{
    const { user_auth_session } = app_store()
    const { status } = user_auth_session
    const [show_log_in_modal, setShowLogInModal] = useState(false)

    return (
        <div
            className="user-session"
            disabled={status !== "logged_in" && status !== "logged_out"}
            onClick={_e =>
            {
                if (status === "logged_in") user_auth_session.logout()
                else if (status === "logged_out" || status === "logged_out__OTP_sign_in_request_errored") setShowLogInModal(true)
                else console.warn("User session is not in a valid state for login/logout:", status)
            }}
        >
            <div>
                {status === "logged_in" ? <>{user_auth_session.user_name ? user_auth_session.user_name : <Loading />}</>
                : status === "logged_out" ? "Log in"
                : status === "logged_out__requesting_OTP_sign_in" ? <>Requesting login<Loading /></>
                : status === "logged_out__OTP_sign_in_request_made" ? "Please check your email"
                : status === "logged_out__OTP_sign_in_request_errored" ? "Log in request failed"
                : <>Loading<Loading /></>}
            </div>
            <IconUser />

            {show_log_in_modal && <LogInModal on_close={() => setShowLogInModal(false)} />}
        </div>
    )
}


function LogInModal({ on_close }: { on_close: () => void })
{
    const { user_auth_session } = app_store()
    const { status } = user_auth_session
    const [email_address, set_email_address] = useState(localStorage.getItem("email_address") || "")

    useEffect(() =>
    {
        if (!email_address.trim()) return
        // Save email address to local storage so it can be pre-filled next time
        localStorage.setItem("email_address", email_address.trim())
    }, [email_address])

    const [link_requested, set_link_requested] = useState(false)

    return (
        <Modal
            opened={true}
            onClose={on_close}
            centered
            size="lg"
        >
            <h2>Log In</h2>

            <TextInput
                label="Email address"
                type="email"
                value={email_address}
                onChange={(e: h.JSX.TargetedEvent<HTMLInputElement, Event>) =>
                {
                    set_email_address(e.currentTarget.value)
                }}
                placeholder="your@email.com"
                required
            />

            <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                {!link_requested ? <Button
                    disabled={!email_address.trim()}
                    onClick={() =>
                    {
                        user_auth_session.request_OTP_sign_in(email_address)
                        set_link_requested(true)
                    }}
                >
                    Request log in magic link
                </Button>
                : (
                    status === "logged_out__requesting_OTP_sign_in" ? <>Requesting login<Loading /></>
                    : status === "logged_out__OTP_sign_in_request_made" ? "Please check your email"
                    : status === "logged_out__OTP_sign_in_request_errored" ? "Log in request failed"
                    : <span></span>
                )}

                <Button
                    onClick={on_close}
                    variant="outline"
                >
                    {!link_requested ? "Cancel" : "Close"}
                </Button>
            </div>
        </Modal>
    )
}
