import { Button, Menu, Modal, TextInput } from "@mantine/core"
import IconLogout from "@tabler/icons-react/dist/esm/icons/IconLogout"
import IconUser from "@tabler/icons-react/dist/esm/icons/IconUser"
import { h } from "preact"
import { useLocation } from "preact-iso"
import { useEffect, useRef, useState } from "preact/hooks"

import pub_sub from "../pub_sub"
import { ROUTES } from "../routes"
import { app_store } from "../state/store"
import "./Header.css"
import Loading from "./Loading"


export default function Header()
{
    const location = useLocation()
    const [show_user_options_dropdown, set_show_user_options_dropdown] = useState(false)
    const toggle_show_user_options_dropdown = () => set_show_user_options_dropdown(!show_user_options_dropdown)

    return (
        <header className="header-bar">
            <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
                <h1 style={{ lineHeight: 0, padding: "0 10px" }}>
                    WikiSim
                </h1>
            </a>

            {!location.path.startsWith("/wiki/search") && <SearchBar />}

            <nav className="right">
                <UserSession
                    toggle_show_user_options_dropdown={toggle_show_user_options_dropdown}
                />
                <DropDownMenu
                    opened={show_user_options_dropdown}
                    set_opened={set_show_user_options_dropdown}
                />
            </nav>

        </header>
    )
}


function SearchBar()
{
    const location = useLocation()
    const [search_query, set_search_query] = useState("")
    const text_input_ref = useRef<HTMLInputElement | null>(null)

    useEffect(() =>
    {
        return pub_sub.sub("key_down", data =>
        {
            if (data.key === "k" && data.ctrlKey)
            {
                // Focus the search input when Ctrl+K is pressed
                text_input_ref.current?.focus()
                text_input_ref.current?.select() // Select the text in the input
            }
        })
    }, [])

    const navigate_to_search = () => location.route(ROUTES.DATA_COMPONENT.SEARCH(search_query))

    return (
        <div className="search-bar">
            <TextInput
                ref={text_input_ref}
                className="search-input"
                value={search_query}
                onChange={(e: h.JSX.TargetedEvent<HTMLInputElement, Event>) =>
                {
                    set_search_query(e.currentTarget.value)
                }}
                onKeyDown={(e: h.JSX.TargetedKeyboardEvent<HTMLInputElement>) =>
                {
                    if (e.key === "Enter") navigate_to_search()
                    if (e.key === "Escape") text_input_ref.current?.blur() // Remove focus from the input
                }}
                onFocus={() => text_input_ref.current?.select() }
                placeholder={"Search WikiSim... (Ctrl+K)"}
            />
            <Button
                variant={"outline"}
                onClick={navigate_to_search}
            >
                Search
            </Button>
        </div>
    )
}


function UserSession(props: { toggle_show_user_options_dropdown: () => void })
{
    const { user_auth_session, ui } = app_store()
    const { status } = user_auth_session
    const { show_log_in_modal, set_show_log_in_modal } = ui

    return (
        <div
            className="user-session"
            disabled={status !== "logged_in" && status !== "logged_out"}
            onPointerDown={_e =>
            {
                if (status === "logged_in") props.toggle_show_user_options_dropdown()
                else if (status === "logged_out" || status === "logged_out__OTP_sign_in_request_errored") set_show_log_in_modal(true)
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

            {show_log_in_modal && <LogInModal on_close={() => set_show_log_in_modal(false)} />}
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
                name="email"
                autocomplete="email"
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
                    Request log in link
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


function DropDownMenu(props: { opened: boolean, set_opened: (opened: boolean) => void })
{
    const { user_auth_session } = app_store()

    return <Menu
        shadow="md"
        width={200}
        opened={props.opened}
        onChange={props.set_opened}
    >
        <Menu.Target>
            {/* This ensures the menu is positioned correctly at the location of
            this &nbsp; ... it is a bit of a hack */}
            <div>&nbsp;</div>
        </Menu.Target>

        <Menu.Dropdown>
            <Menu.Item
                leftSection={<IconLogout size={14} />}
                onClick={() =>
                {
                    user_auth_session.logout()
                }}
            >
                Log Out
            </Menu.Item>
        </Menu.Dropdown>
    </Menu>
}
