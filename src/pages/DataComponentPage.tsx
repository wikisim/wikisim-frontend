import { useLocation } from "preact-iso"
import { useEffect, useState } from "preact/hooks"

import { DataComponent } from "core/data/interface"

import HistoryIcon from "../assets/history.svg"
import EditOrSaveButton from "../buttons/EditOrSaveButton"
import pub_sub from "../pub_sub"
import { ROUTES } from "../routes"
import { get_async_data_component } from "../state/data_components/accessor"
import { app_store } from "../state/store"
import { sanitize_with_TipTap } from "../text_editor/sanitise_html"
import Loading from "../ui_components/Loading"
import { time_ago_or_date } from "../utils/time_ago_or_date"
import "./DataComponentPage.css"


export function DataComponentPage(props: { data_component_id: string, query: Record<string, string> })
{
    const location = useLocation()
    const state = app_store()
    const data_component = get_async_data_component(state, props.data_component_id)
    const { component, status } = data_component

    if (!component)
    {
        if (status === "loading") return <div>Loading data component...</div>
        if (status === "error") return <div>Error loading data component.</div>
        return <div>Data component not found.</div>
    }


    // Subscribe to cmd + enter key combo to open the save modal for the component
    useEffect(() => pub_sub.sub("key_down", data =>
    {
        if (data.key !== "Enter" || !data.metaKey) return
        location.route(ROUTES.DATA_COMPONENT.EDIT(component.id.as_IdOnly()))
    }), [component.id.id])


    return <>
        <div className="page-container">
            <div style={{ float: "right", margin: "10px" }}>
                <EditOrSaveButton
                    editing={false}
                    set_editing={() => location.route(ROUTES.DATA_COMPONENT.EDIT(component.id.as_IdOnly()))}
                />
            </div>

            <div className="tiptap-content">
                <h2 dangerouslySetInnerHTML={{ __html: sanitize_with_TipTap(component.title, true) }} />

                <div dangerouslySetInnerHTML={{ __html: sanitize_with_TipTap(component.description, false) }} />
            </div>

        </div>
        <LastEditedBy component={component} />
    </>
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
        else if (async_user.status === "error" || async_user.status === "not_found")
        {
            set_user_name("Unknown User")
        }
    }, [async_user])

    return (
        <div className="last-edited-by">
            <img src={HistoryIcon} alt="History" width={20} height={20} style={{ verticalAlign: -5, margin: "0px 5px" }} />

            <a href={ROUTES.DATA_COMPONENT.VIEW_VERSION_HISTORY(component.id.as_IdOnly())}>
                Last edited{" "}
                {time_ago_or_date(created_at, true)}{" "}
                {time_ago_or_date(created_at)}
            </a>{" "}
            by <a href={user_link}>{user_name || <Loading />}</a>
        </div>
    )
}
