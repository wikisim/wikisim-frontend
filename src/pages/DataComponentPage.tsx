import { useEffect, useState } from "preact/hooks"

import { DataComponent } from "core/data/interface"

import { ROUTES } from "../routes"
import { get_async_data_component } from "../state/data_components/accessor"
import { app_store } from "../state/store"
import { sanitize_with_TipTap } from "../text_editor/sanitise_html"
import Loading from "../ui_components/Loading"


export function DataComponentPage(props: { data_component_id: string, query: Record<string, string> })
{
    const state = app_store()
    const data_component = get_async_data_component(state, props.data_component_id)
    const { component, status } = data_component

    if (!component)
    {
        if (status === "loading" || status === "requested") return <div>Loading data component...</div>
        if (status === "error") return <div>Error loading data component.</div>
        return <div>Data component not found.</div>
    }

    return (
        <div>
            <h2 dangerouslySetInnerHTML={{ __html: sanitize_with_TipTap(component.title, true) }} />

            <div dangerouslySetInnerHTML={{ __html: sanitize_with_TipTap(component.description, false) }} />

            <LastEditedBy component={component} />
        </div>
    )
}


function LastEditedBy({ component }: { component: DataComponent })
{
    const store = app_store()

    const { created_at, editor_id } = component
    const user_link = `/user/${editor_id}`

    const [user_name, set_user_name] = useState("")
    const async_user = store.users.request_user(editor_id)

    useEffect(() =>
    {
        if (async_user.status === "loaded")
        {
            set_user_name(async_user.user!.name)
        }
        else if (async_user.status === "error")
        {
            // console .error("Error fetching user name:", async_user.error)
            set_user_name("Unknown User")
        }
    }, [async_user])

    return (
        <div className="last-edited-by">
            Last edited by&nbsp;
            <a href={user_link}>{user_name || <Loading />}</a>&nbsp;
            at&nbsp;
            <a href={ROUTES.DATA_COMPONENT.VIEW_VERSION_HISTORY(component.id)}>{created_at.toString()}</a>
        </div>
    )
}
