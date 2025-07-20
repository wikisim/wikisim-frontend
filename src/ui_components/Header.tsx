import IconUser from "@tabler/icons-react/dist/esm/icons/IconUser"

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

    return (
        <div
            className="user-session"
            disabled={status !== "logged_in" && status !== "logged_out"}
            onClick={_e =>
            {
                if (status === "logged_in") user_auth_session.logout()
                else if (status === "logged_out") user_auth_session.request_OTP_sign_in(prompt("Enter your email address to log in:") || "")
                else console.warn("User session is not in a valid state for login/logout:", status)
            }}
        >
            <div>
                {status === "logged_in" ? <>{user_auth_session.user_name ? user_auth_session.user_name : <Loading />} Log out</>
                : status === "logged_out" ? "Login"
                : status === "logged_out__requesting_OTP_sign_in" ? <>Requesting login<Loading /></>
                : status === "logged_out__OTP_sign_in_request_made" ? "Please check your email"
                : status === "logged_out__OTP_sign_in_request_errored" ? "Login request failed"
                : <>Loading<Loading /></>}
            </div>
            <IconUser />
        </div>
    )
}
