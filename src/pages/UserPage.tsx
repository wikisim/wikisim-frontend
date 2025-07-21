
import { app_store } from "../state/store"
import { get_async_user } from "../state/users/accessor"
import "./DataComponentPage.css"


export function UserPage(props: { user_id: string })
{
    const state = app_store()
    const async_user = get_async_user(state, props.user_id)
    const { user, status } = async_user

    if (!user)
    {
        if (status === "loading" || status === "requested") return <div>Loading user info...</div>
        if (status === "error") return <div>Error loading user info.</div>
        return <div>User not found.</div>
    }

    return <>
        <div className="page-container">
            <h2>
                <span style={{ fontSize: 15, fontWeight: "normal" }}>User page for</span>
                {" " + user.name}
            </h2>
        </div>
    </>
}
