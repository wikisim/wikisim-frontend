import { useLocation } from "preact-iso"

import { init_new_data_component } from "core/data/modify"

import { ROUTES } from "../routes"
import { app_store } from "../state/store"
import { LogInInlineText } from "../ui_components/LogInInlineText"
import { DataComponentEditForm } from "./DataComponentPageEdit/DataComponentEditForm"


export function DataComponentPageNew(_props: { query: Record<string, string> })
{
    const state = app_store()
    const location = useLocation()

    const { id } = state.user_auth_session.session?.user || {}
    if (!id)
    {
        return <div className="page-container">
            <p>Please <LogInInlineText /> to create a new data component.</p>
        </div>
    }

    const data_component = init_new_data_component()
    data_component.editor_id = id

    return (
        <div className="page-container">
            <h2>New Data Component</h2>

            <DataComponentEditForm
                async_status="loaded"
                data_component={data_component}
                handle_save={draft_data_component =>
                {
                    return state.data_components.insert_data_component(draft_data_component)
                        .then(({ error, id }) =>
                        {
                            if (id) location.route(ROUTES.DATA_COMPONENT.VIEW(id.as_IdOnly()))

                            return { error }
                        })
                }}
            />
        </div>
    )
}
