import { useEffect } from "preact/hooks"

import { IdAndVersion, parse_id } from "core/data/id"

import { ROUTES } from "../routes"
import { get_async_data_component } from "../state/data_components/accessor"
import { app_store } from "../state/store"
import { ReadOnly } from "../text_editor/santisise_html/sanitise_html"
import Loading from "../ui_components/Loading"
import { set_page_title } from "../ui_components/set_page_title"
import { time_ago_or_date } from "../utils/time_ago_or_date"
import "./DataComponentPageBackReferences.css"
import { DataComponentPageRedirectToIdOnly } from "./DataComponentPageRedirectToIdOnly"


export function DataComponentPageBackReferences(props: { data_component_id: string, query: Record<string, string> })
{
    const id = parse_id(props.data_component_id)
    if (id instanceof IdAndVersion) return <DataComponentPageRedirectToIdOnly
        redirect_to={ROUTES.DATA_COMPONENT.VIEW_BACK_REFERENCES(id.as_IdOnly())}
        description="referenced by"
    />

    // const page = clamp(parseInt(props.query.page || "1", 10) - 1, 0, 1000)
    // const page_size = parseInt(props.query.page_size || "20", 10)

    const state = app_store()
    const newest_async_data_component = get_async_data_component(state, props.data_component_id, false)
    const { component } = newest_async_data_component

    if (newest_async_data_component.status === "error")
    {
        return <div className="page-container">
            <div>Error loading page: {newest_async_data_component.error}</div>
        </div>
    }
    else if (newest_async_data_component.status === "not_found" || !component)
    {
        return <div className="page-container">
            <div>Page not found.</div>
        </div>
    }


    useEffect(() => set_page_title(component.plain_title + " referenced by"), [component.plain_title])


    // Load up back references for the current page
    const async_metrics = state.data_components.request_metrics(id)

    if (async_metrics.status === "loading")
    {
        return <div className="page-container">
            <Loading />
        </div>
    }
    else if (async_metrics.status === "error")
    {
        return <div className="page-container">
            <div>Error loading back references: {async_metrics.error?.message}</div>
        </div>
    }
    else if (!async_metrics.metrics)
    {
        return <div className="page-container">
            <div>Metrics not found.</div>
        </div>
    }


    const { back_reference_component_ids } = async_metrics.metrics


    const none = back_reference_component_ids.length === 0
    // const max_alternatives = alternative_component_ids.length
    // const number_to_show = clamp(page_size, 0, max_alternatives - (page * page_size))
    // const to_alternative = max_alternatives - (page * page_size)
    // const from_alternative = Math.min(to_alternative, to_alternative - number_to_show + 1)

    return (
        <div className="page-container">
            <h2>
                <a href={ROUTES.DATA_COMPONENT.VIEW(component.id.as_IdOnly())}>
                    <ReadOnly html={component.title} single_line={true} />
                </a>
            </h2>

            {none
            ? <>Not referenced by anything yet.</>
            : <>
                Referenced by:
                {back_reference_component_ids.map(alt_id => <ReferenecedByRow key={alt_id.to_str()} id={alt_id} />)}
                <br />
                {/* Page {page + 1} */}
                {/* Showing alternatives {from_alternative} to {to_alternative} */}
            </>}
        </div>
    )
}



function ReferenecedByRow(props: { id: IdAndVersion })
{
    const state = app_store()
    const async_data_component = get_async_data_component(state, props.id.to_str(), false)
    const { component } = async_data_component

    if (async_data_component.status === "loading")
    {
        return <div className="referenced-by-row">Loading back reference {props.id.to_str()}...</div>
    }
    else if (async_data_component.status === "error")
    {
        return <div className="referenced-by-row">Error loading back reference {props.id.to_str()}: {async_data_component.error}</div>
    }
    else if (async_data_component.status === "not_found" || !component)
    {
        return <div className="referenced-by-row">Back reference {props.id.to_str()} not found.</div>
    }

    const async_editor = state.users.request_user(component.editor_id)
    const { user: editor } = async_editor

    return <div className="referenced-by-row loaded">
        <a
            href={ROUTES.DATA_COMPONENT.VIEW({ id: props.id, owner_id: component.owner_id })}
            title={component.created_at.toUTCString()}
        >
            {component.plain_title}
        </a> &nbsp; &nbsp;
            edited {time_ago_or_date(component.created_at, true)}{" "}
            {time_ago_or_date(component.created_at)} by{" "}
            {/* on {component.created_at.toString()} by{" "} */}
            {async_editor.status === "loading" ? <Loading />
            : async_editor.status === "loaded" && editor ? editor.name
            : "Error loading editor name"}
    </div>
}
