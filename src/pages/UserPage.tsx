import { Button, Checkbox } from "@mantine/core"
import IconHelpCircle from "@tabler/icons-react/dist/esm/icons/IconHelpCircle"
import { useEffect, useState } from "preact/hooks"

import { useLocation } from "preact-iso"
import { TargetedEvent } from "preact/compat"
import { HelpToolTip } from "../buttons/HelpText"
import { ROUTES } from "../routes"
import { local_storage } from "../state/local_storage"
import { app_store } from "../state/store"
import { get_async_user } from "../state/users/accessor"
import { NewDataComponentButtons } from "../ui_components/NewDataComponentButtons"
import { set_page_title } from "../ui_components/set_page_title"
import "./UserPage.css"


export function UserPage(props: { user_id_or_name: string })
{
    const location = useLocation()

    const state = app_store()
    const async_user = get_async_user(state, props.user_id_or_name)
    const { user, status } = async_user

    const [show_option_for_code_editor, set_show_option_for_code_editor] = useState(local_storage.get_show_option_for_code_editor())

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
        location.route(ROUTES.USER.VIEW(user.name), true)
    }, [user.name, props.user_id_or_name])


    useEffect(() => set_page_title(user.name + " user profile"), [user.name])


    const signed_in_user_id = state.user_auth_session.session?.user.id
    const is_you = signed_in_user_id === user.id


    return <>
        <div className="page-container">
            <h2>
                {user.name}'s profile
            </h2>

            <div className="user-page-row">
                <Button
                    component="a"
                    href={ROUTES.DATA_COMPONENT.SEARCH({ user_id: user.id })}
                    variant="primary-user"
                    size="sm"
                >{user.name}'s pages</Button>
            </div>

            <div class="vertical-gap" />

            <div className="user-page-row">
                <Button
                    disabled={true}
                    component="a"
                    href={ROUTES.DATA_COMPONENT.SEARCH({ user_id: user.id })}
                    variant="primary-user"
                    size="sm"
                >Edits by {user.name} (not implemented yet)</Button>
            </div>

            <div class="vertical-gap" />

            {is_you && <NewDataComponentButtons button_size="sm" />}

            <div class="vertical-gap" />

            {is_you && <HelpToolTip
                message={`When enabled, this will show a toggle next to the Value Input text field to allow you to swap between the normal text editor and the prototype code editor.  This is still a work in progress so it may partially corrupt your code when you switch back and forth.`}
            >
                <div style={{ display: "flex", width: "fit-content" }}>
                    <Checkbox
                        size="md"
                        label="Allow use of prototype code editor"
                        onChange={(e: TargetedEvent<HTMLInputElement, Event>) =>
                        {
                            set_show_option_for_code_editor(e.currentTarget.checked)
                            local_storage.set_show_option_for_code_editor(e.currentTarget.checked)
                        }}
                        checked={show_option_for_code_editor}
                    />
                    <IconHelpCircle size={16} style={{ marginLeft: 4 }} />
                </div>
            </HelpToolTip>}
        </div>
    </>
}
