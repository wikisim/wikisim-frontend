import { get_async_data_component } from "../state/data_components/accessor"
import { app_store } from "../state/store"


export function DataComponentPageEdit(props: { data_component_id: string, query: Record<string, string> })
{
    const state = app_store()
    const data_component = get_async_data_component(state, props.data_component_id)

    return (
        <div>
            <h2>Data Component:</h2>

            <pre>
                {JSON.stringify(data_component)}
            </pre>
        </div>
    )
}
