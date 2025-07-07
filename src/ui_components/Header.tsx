import IconUser from "@tabler/icons-react/dist/esm/icons/IconUser"

import { get_store } from "../state/store"
import "./Header.css"


export default function Header() {
    return (
        <header className="header-bar">
            <nav className="right">
                <UserSession />
            </nav>
        </header>
    )
}


function UserSession()
{
    const { user_auth_session } = get_store()
    const logged_in = user_auth_session.isLoggedIn


    return (
        <div
            className="user-session"
            onClick={e =>
            {
                if (logged_in) user_auth_session.logout()
                else user_auth_session.login({ id: "2", name: "Another Person", email: "" })
            }}
        >
            <div>{ logged_in ? `log out ${user_auth_session.user?.name}` : "Login"}</div>
            <IconUser />
        </div>
    )
}
