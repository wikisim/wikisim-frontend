import IconUser from "@tabler/icons-react/dist/esm/icons/IconUser"

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


function UserSession() {
    return (
        <div
            className="user-session"
            onClick={e =>
            {

            }}
        >
            <div>Login</div>
            <IconUser />
        </div>
    )
}
