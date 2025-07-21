// import { request_data_component_history } from "core/data/fetch_from_db"
// import { get_supabase } from "core/supabase"

// import { app_store } from "../state/store"


export function DataComponentPageVersionHistory(props: { data_component_id: number, query: Record<string, string> })
{
    // const state = app_store()

    const page = parseInt(props.query.page || "1", 10)
    const page_size = parseInt(props.query.page_size || "20", 10)

    // const data = state.data_components.request_data_component_history(props.data_component_id, page - 1, page_size)

    // const _async_data_component = request_data_component_history(get_supabase, props.data_component_id)

    return (
        <div className="page-container">
            <h2>Version History for Data Component</h2>

            Page {page} showing {page_size}.
            {/* {async_data_component.} */}

        </div>
    )
}
