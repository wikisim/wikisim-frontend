import { Button } from "@mantine/core"
import { useEffect } from "preact/hooks"

import { ROUTES } from "../routes"
import { app_store } from "../state/store"
import { get_async_user } from "../state/users/accessor"
import { NewDataComponentButtons } from "../ui_components/NewDataComponentButtons"
import { set_page_title } from "../ui_components/set_page_title"
import "./UserPage.css"


export function UserPage(props: { user_id_or_name: string })
{
    const state = app_store()
    const async_user = get_async_user(state, props.user_id_or_name)
    const { user, status } = async_user

    if (!user)
    {
        if (status === "loading" || status === "requested") return <div>Loading user info...</div>
        if (status === "error") return <div>Error loading user info.</div>
        return <div>User not found.</div>
    }


    // Check that the user_id_or_name provided in the props matches the name of
    // the user, if not, then replace that in the page URL to be the users name.
    useEffect(() =>
    {
        if (user.name === props.user_id_or_name) return
        history.replaceState({}, "", ROUTES.USER.VIEW(user.name))
    }, [user.name, props.user_id_or_name])


    useEffect(() => set_page_title(user.name + " user profile"), [user.name])


    const signed_in_user_id = state.user_auth_session.session?.user.id
    const is_you = signed_in_user_id === user.id


    return <>
        <div className="page-container">
            <h2>
                <span style={{ fontSize: 15, fontWeight: "normal" }}>User page for</span>
                {" " + user.name}
            </h2>

            <div className="user-page-row">
                <s>Show list of edits by {user.name}</s><Button
                    disabled={true}
                    component="a"
                    href={ROUTES.DATA_COMPONENT.SEARCH({ user_id: user.id })}
                    variant="primary-user"
                    size="md"
                >Not implemented yet</Button>
            </div>

            <div class="vertical-gap" />

            <div className="user-page-row">
                Show list of {user.name}'s user space pages<Button
                    component="a"
                    href={ROUTES.DATA_COMPONENT.SEARCH({ user_id: user.id })}
                    variant="primary-user"
                    size="md"
                >Search</Button>
            </div>

            {is_you && <NewDataComponentButtons button_size="md" />}
        </div>
    </>
}
