import type { DataComponent } from "core/data/interface"

import { ROUTES } from "../routes"
import { app_store } from "../state/store"
import { ensure_owner_is_loaded } from "./utils/managing_url_for_user_components"



export function BannerWarningOfUserOwnedPage(props: { component: DataComponent })
{
    const state = app_store()
    const { component } = props

    const { async_user } = ensure_owner_is_loaded(state, component)

    if (!async_user || async_user.status === "loading") return null


    const page_is_user_owned = !!component.owner_id
    const page_owner_not_found = page_is_user_owned && async_user.status === "not_found"
    const user_is_you = async_user.user?.id === state.user_auth_session.session?.user.id
    const user_is_logged_in = !!state.user_auth_session.session?.user.id

    if (!page_is_user_owned) return null


    return <div className="generic-error-message warning">
        This page belongs to {page_owner_not_found
            ? `an unknown user (ID: ${component.owner_id}).`
            : <a href={ROUTES.USER.VIEW(component.owner_id)}>
                {user_is_you ? `you (${async_user.user?.name})` : async_user.user?.name}
            </a>
        }.
        It is not in the wiki yet but{(!user_is_logged_in || user_is_you) ? " anyone can copy anything here into their" : " you can copy anything here into your"} own user pages or the wiki.
    </div>
}


const emphasis_style: React.CSSProperties = {
    fontWeight: "bold",
    fontStyle: "italic",
}
export const WARNING_TEXT_OWNED_PAGE = <>
    Please be aware that like the rest of the Wiki,
    the <span style={{}}>user pages</span> you
    create are <span style={emphasis_style}>public</span> which means they
    <ul>
        <li>can be freely copied by anyone and</li>
        <li>can not be deleted once created</li>
    </ul>
</>
