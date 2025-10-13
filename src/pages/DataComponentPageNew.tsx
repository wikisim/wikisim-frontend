import { useLocation } from "preact-iso"
import { useEffect, useState } from "preact/hooks"

import { init_new_data_component } from "core/data/modify"

import { ROUTES } from "../routes"
import { app_store } from "../state/store"
import { LogInInlineText } from "../ui_components/LogInInlineText"
import { set_page_title } from "../ui_components/set_page_title"
import { DataComponentEditForm } from "./DataComponentPageEdit/DataComponentEditForm"


export function DataComponentPageNew(_props: { query: Record<string, string> })
{
    useEffect(set_page_title, [])

    const state = app_store()
    const location = useLocation()

    const [is_user_owned, set_is_user_owned] = useState(false)

    const { id } = state.user_auth_session.session?.user || {}
    if (!id)
    {
        return <div className="page-container">
            <p>Please <LogInInlineText /> to create a new page.</p>
        </div>
    }

    const data_component = init_new_data_component()
    data_component.editor_id = id

    return (
        <div className="page-container">
            <h2>New {is_user_owned ? "User Owned" : "Wiki"} Page</h2>

            <DataComponentEditForm
                async_status="loaded"
                data_component={data_component}
                on_component_change={dc => set_is_user_owned(!!dc.owner_id)}
                handle_save={draft_data_component =>
                {
                    return state.data_components.insert_data_component(draft_data_component)
                        .then(({ error, id }) =>
                        {
                            if (id) location.route(ROUTES.DATA_COMPONENT.VIEW_WIKI_COMPONENT(id.as_IdOnly()))

                            return { error }
                        })
                }}
            />
        </div>
    )
}
