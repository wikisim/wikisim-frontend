import { useLocation } from "preact-iso"
import { useEffect, useMemo, useState } from "preact/hooks"

import { IdAndVersion, parse_id } from "core/data/id"
import { clamp } from "core/utils/clamp"

import { ROUTES } from "../routes"
import { get_async_data_component } from "../state/data_components/accessor"
import { app_store } from "../state/store"
import { ReadOnly } from "../text_editor/sanitise_html"
import Loading from "../ui_components/Loading"
import { time_ago_or_date } from "../utils/time_ago_or_date"
import "./DataComponentPageVersionHistory.css"


export function DataComponentPageVersionHistory(props: { data_component_id: string, query: Record<string, string> })
{
    const id = parse_id(props.data_component_id)
    if (id instanceof IdAndVersion) return <DataComponentPageVersionHistoryRedirect id={id} />

    const page = clamp(parseInt(props.query.page || "1", 10) - 1, 0, 1000)
    const page_size = parseInt(props.query.page_size || "20", 10)

    const state1 = app_store()
    const initial_data_component_present = useMemo(() =>
    {
        // When this component page is first mounted we want to get the latest
        // version of the data component.
        // Note that you can not move the call to `const state1 = app_store()`
        // into the useMemo, as it makes the other hooks not work properly.
        state1.data_components.request_data_component_history(id, page, page_size, true)

        // We also check if we've already loaded the data component to indicate
        // to the user that we are refreshing the data component rather than
        // loading it refresh.
        const id_str = id.to_str_without_version()
        const initial_data_component = (
            state1.data_components.data_component_by_id_and_maybe_version[id_str]
        )
        return !!initial_data_component
    }, [])

    const state2 = app_store()
    const newest_async_data_component = get_async_data_component(state2, props.data_component_id, false)
    const { component } = newest_async_data_component

    if (newest_async_data_component.status === "loading")
    {
        return <div className="page-container">
            <div>{initial_data_component_present ? "Refreshing" : "Loading"} page version history<Loading/></div>
        </div>
    }
    else if (newest_async_data_component.status === "error")
    {
        return <div className="page-container">
            <div>Error loading page version history: {newest_async_data_component.error}</div>
        </div>
    }
    else if (newest_async_data_component.status === "not_found" || !component)
    {
        return <div className="page-container">
            <div>Page not found.</div>
        </div>
    }

    const max_version = component.id.version
    const number_to_show = clamp(page_size, 0, max_version - (page * page_size))
    const from_version = max_version - (page * page_size)
    const to_version = from_version - number_to_show + 1
    let version_numbers = from_version
    const row_versions = Array.from(Array(number_to_show)).map(() => version_numbers--)

    return (
        <div className="page-container">
            <h2>Version History for <a href={ROUTES.DATA_COMPONENT.VIEW_WIKI_COMPONENT(component.id.as_IdOnly())}>
                <ReadOnly html={component.title} single_line={true} />
            </a></h2>

            Page {page + 1} showing{" "}
            {/* {number_to_show} of {max_version} from */}
            versions {to_version} to {from_version}.
            {row_versions.map(v => <HistoryRow key={v} id={id.add_version(v)} />)}

        </div>
    )
}



function DataComponentPageVersionHistoryRedirect(props: { id: IdAndVersion })
{
    const redirect_to = ROUTES.DATA_COMPONENT.VIEW_VERSION_HISTORY(props.id.as_IdOnly())
    const location = useLocation()
    const [seconds, set_seconds] = useState(10)

    useEffect(() =>
    {
        const interval = setInterval(() =>
        {
            set_seconds(s =>
            {
                if (s <= 1)
                {
                    location.route(redirect_to)
                    clearInterval(interval)
                    return s
                }
                return s - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    return <div className="page-container">
        <p>Click here <a href={redirect_to}>to view the history</a> of this page.</p>
        <p>Redirecting in {seconds}<Loading /></p>
    </div>
}


function HistoryRow(props: { id: IdAndVersion })
{
    const state = app_store()
    const location = useLocation()
    const async_data_component = get_async_data_component(state, props.id.to_str(), false)
    const { component } = async_data_component

    if (async_data_component.status === "loading")
    {
        return <div className="history-row">Loading version {props.id.version}...</div>
    }
    else if (async_data_component.status === "error")
    {
        return <div className="history-row">Error loading version {props.id.version}: {async_data_component.error}</div>
    }
    else if (async_data_component.status === "not_found" || !component)
    {
        return <div className="history-row">Version {props.id.version} not found.</div>
    }

    const async_editor = state.users.request_user(component.editor_id)
    const { user: editor } = async_editor

    return (
        <div
            className="history-row loaded"
            onClick={() => location.route(ROUTES.DATA_COMPONENT.VIEW_WIKI_COMPONENT(props.id))}
        >
            Version {props.id.version}: &nbsp; &nbsp;
            {component.comment || " -- "} &nbsp; &nbsp;
            {time_ago_or_date(component.created_at, true)}{" "}
            {time_ago_or_date(component.created_at)} by{" "}
            {/* on {component.created_at.toString()} by{" "} */}
            {async_editor.status === "loading" ? <Loading />
            : async_editor.status === "loaded" && editor ? editor.name
            : "Error loading editor name"}
        </div>
    )
}
