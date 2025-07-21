import { useEffect, useState } from "preact/hooks"

import { DataComponent } from "core/data/interface"

import { useLocation } from "preact-iso"
import HistoryIcon from "../assets/history.svg"
import EditButton from "../buttons/EditButton"
import { ROUTES } from "../routes"
import { get_async_data_component } from "../state/data_components/accessor"
import { app_store } from "../state/store"
import { sanitize_with_TipTap } from "../text_editor/sanitise_html"
import Loading from "../ui_components/Loading"
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

    return <>
        <div className="page-container">
            <div style={{ float: "right", margin: "10px" }}>
                <EditButton
                    editing={false}
                    set_editing={() => location.route(ROUTES.DATA_COMPONENT.EDIT(component.id))}
                />
            </div>

            <h2 dangerouslySetInnerHTML={{ __html: sanitize_with_TipTap(component.title, true) }} />

            <div dangerouslySetInnerHTML={{ __html: sanitize_with_TipTap(component.description, false) }} />

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

            <a href={ROUTES.DATA_COMPONENT.VIEW_VERSION_HISTORY(component.id)}>
                Last edited{" "}
                {time_ago_or_date(created_at, true)}{" "}
                {time_ago_or_date(created_at)}
            </a>{" "}
            by <a href={user_link}>{user_name || <Loading />}</a>
        </div>
    )
}


function time_ago_or_date(date: Date, text_to_preprend: boolean = false): string
{
    const now = new Date()

    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 3) return text_to_preprend ? "on" : date.toDateString()
    if (text_to_preprend) return "about"
    if (days > 0) return `${pluralise(days, "day")} ago`
    if (hours > 0) return `${pluralise(hours, "hour")} ago`
    if (minutes > 0) return `${pluralise(minutes, "minute")} ago`
    return `${pluralise(seconds, "second")} ago`
}

function pluralise(count: number, singular: string): string
{
    return `${count} ${singular}${count !== 1 ? "s" : ""}`
}
