import { useEffect, useRef, useState } from "preact/hooks"

import { IdAndVersion, IdOnly, parse_id } from "core/data/id"

import { component_is_an_alternative } from "../../lib/core/src/data/component_is_an_alternative"
import { IconAlternative } from "../assets/icons"
import pub_sub from "../pub_sub"
import { ROUTES } from "../routes"
import { get_async_data_component } from "../state/data_components/accessor"
import { app_store } from "../state/store"
import { ReadOnly } from "../text_editor/santisise_html/sanitise_html"
import { TextEditorV1 } from "../text_editor/TextEditorV1"
import Loading from "../ui_components/Loading"
import { NewWikiDataComponentButton } from "../ui_components/NewDataComponentButtons"
import { set_page_title } from "../ui_components/set_page_title"
import { time_ago_or_date } from "../utils/time_ago_or_date"
import "./DataComponentPageAlternatives.css"
import { DataComponentPageRedirectToIdOnly } from "./DataComponentPageRedirectToIdOnly"


export function DataComponentPageAlternatives(props: { data_component_id: string, query: Record<string, string> })
{
    const id = parse_id(props.data_component_id)
    if (id instanceof IdAndVersion) return <DataComponentPageRedirectToIdOnly
        redirect_to={ROUTES.DATA_COMPONENT.VIEW_ALTERNATIVES(id.as_IdOnly())}
        description="alternatives"
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


    useEffect(() => set_page_title(component.plain_title + " alternatives"), [component.plain_title])


    // Load up alternatives for the current page
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
            <div>Error loading alternatives: {async_metrics.error?.message}</div>
        </div>
    }
    else if (!async_metrics.metrics)
    {
        return <div className="page-container">
            <div>Metrics not found.</div>
        </div>
    }


    const { alternative_component_ids } = async_metrics.metrics


    const none = alternative_component_ids.length === 0
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
            ? <>No alternatives yet.</>
            : <>
                Alternatives according to:
                {alternative_component_ids.map(alt_id => <AlternativeRow
                    key={alt_id.to_str()}
                    id={alt_id}
                    source_id={id}
                />)}
                <br />
                {/* Page {page + 1} */}
                {/* , showing alternatives {from_alternative} to {to_alternative} */}
            </>}

            <br />

            <CreateAlternative
                subject_id={component.id.id}
                subject_title={component.plain_title}
            />
        </div>
    )
}



function AlternativeRow(props: { id: IdAndVersion, source_id: IdOnly })
{
    const state = app_store()
    const async_data_component = get_async_data_component(state, props.id.to_str(), false)
    const { component } = async_data_component

    if (async_data_component.status === "loading")
    {
        return <div className="alternative-row">Loading alternative {props.id.to_str()}...</div>
    }
    else if (async_data_component.status === "error")
    {
        return <div className="alternative-row">Error loading alternative {props.id.to_str()}: {async_data_component.error}</div>
    }
    else if (async_data_component.status === "not_found" || !component)
    {
        return <div className="alternative-row">Alternative {props.id.to_str()} not found.</div>
    }
    else if (!component.according_to_id)
    {
        return <div className="alternative-row">Alternative {props.id.to_str()} has no "according to" reference.</div>
    }

    const async_according_to = get_async_data_component(state, `${component.according_to_id}`, false)
    const { component: according_to_component } = async_according_to

    if (async_according_to.status === "loading")
    {
        return <div className="alternative-row">Loading "according to" reference for alternative {props.id.to_str()}...</div>
    }
    else if (async_according_to.status === "error")
    {
        return <div className="alternative-row">Error loading "according to" reference for alternative {props.id.to_str()}: {async_according_to.error}</div>
    }
    else if (async_according_to.status === "not_found" || !according_to_component)
    {
        return <div className="alternative-row">"According to" reference for alternative {props.id.to_str()} not found.</div>
    }

    const async_editor = state.users.request_user(component.editor_id)
    const { user: editor } = async_editor

    const is_an_alternative = component_is_an_alternative(component)
    const is_an_alternative_of_this_page = component.subject_id === props.source_id.id
    const alternative_of_text = is_an_alternative_of_this_page
        ? "Is an alternative of this page."
        // This should never be the case but including just in case
        : is_an_alternative
        ? "Is an alternative of another page."
        : ""

    return <div className="alternative-row loaded">
        <a
            href={ROUTES.DATA_COMPONENT.VIEW({ id: props.id.as_IdOnly(), owner_id: component.owner_id })}
            title={component.created_at.toUTCString()}
        >
            {according_to_component.plain_title}
            {" "} {is_an_alternative && <IconAlternative
                size={14}
                title={alternative_of_text}
            />}
        </a> &nbsp; &nbsp;
            edited {time_ago_or_date(component.created_at, true)}{" "}
            {time_ago_or_date(component.created_at)} by{" "}
            {/* on {component.created_at.toString()} by{" "} */}
            {async_editor.status === "loading" ? <Loading />
            : async_editor.status === "loaded" && editor ? editor.name
            : "Error loading editor name"}

    </div>
}


interface CreateAlternativeProps
{
    subject_id: number
    subject_title: string
}
function CreateAlternative(props: CreateAlternativeProps)
{
    const [according_to, set_according_to] = useState<{ id: number, title: string }>({
        id: 0,
        title: "",
    })

    return <div className="create-alternative">
        <h3>Create a new alternative</h3>

        <SelectEntity
            according_to={according_to}
            set_according_to={set_according_to}
        />

        <br />

        <NewWikiDataComponentButton
            title={`Create alternative`}
            disabled={!according_to.id}
            args={{
                subject_id: props.subject_id,
                according_to_id: according_to.id,
            }}
        />
    </div>
}


interface SelectEntityProps
{
    according_to: { id: number, title: string }
    set_according_to: (content: { id: number, title: string }) => void
}
function SelectEntity(props: SelectEntityProps)
{
    const { according_to, set_according_to } = props

    // Generate a random source ID
    const search_requester_id = useRef("_" + Math.random().toString(10).slice(2, 10))
    useEffect(() =>
    {
        return pub_sub.sub("search_for_reference_completed", data =>
        {
            if (data.search_requester_id !== search_requester_id.current) return

            // Set the selected search result
            set_according_to({
                id: data.data_component.id.id,
                title: data.data_component.plain_title,
            })
        })
    })

    return <div style={{ maxWidth: "500px", position: "relative" }}>
        <TextEditorV1
            initial_content={according_to.title}
            content={according_to.title}
            editable={false}
            label="According to..."
        />
        <div
            onClick={() =>
            {
                pub_sub.pub("search_for_reference", { search_requester_id: search_requester_id.current })
            }}
            style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, cursor: "pointer" }}
        />
    </div>
}
