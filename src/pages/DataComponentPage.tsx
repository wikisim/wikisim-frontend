import { DataComponentIdMaybeVersion } from "../../lib/core/src/data/id"
import { app_store } from "../state/store"


function get_data_component(data_component_id: string)
{
    const state = app_store()
    const { data_components_by_id, data_component_by_id_and_version } = state.data_components
    const id = DataComponentIdMaybeVersion.from_str(data_component_id)

    const data_component = id.version === undefined
        ? (data_components_by_id[data_component_id] || [])[0]
        : data_component_by_id_and_version[data_component_id]

    if (!data_component)
    {
        console.debug(`Data component with ID ${data_component_id} not found.  Requesting to load it.`)
        state.data_components.request_data_component(id)
    }

    return data_component
}


export function DataComponentPage(props: { data_component_id: string, query: Record<string, string> })
{
    const data_component = get_data_component(props.data_component_id)

    // import { useLocation } from "preact-iso"
    // const location = useLocation()
    // location.route(new_path)

    return (
        <div>
            <h2>Data Component:</h2>

            <pre>
                {JSON.stringify(data_component)}
            </pre>

            {/* <p onClick={() => location.route("/")}>Home page</p> */}
        </div>
    )
}
