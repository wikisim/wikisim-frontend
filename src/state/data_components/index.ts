import { DataComponentIdMaybeVersion } from "../../../lib/core/src/data/id"
import { GetType, SetType } from "../interface"
import { AppStore } from "../store"
import { DataComponentsState } from "./interface"


export function initial_state(set: SetType, get: GetType): DataComponentsState
{
    return {
        data_components_by_id: {},
        data_component_by_id_and_version: {},

        request_data_component: (data_component_id: string | DataComponentIdMaybeVersion) =>
        {
            const { data_components_by_id, data_component_by_id_and_version } = get().data_components
            const id = DataComponentIdMaybeVersion.from_str(data_component_id)
            const id_str = id.to_str(id.version === undefined)

            let data_component = (
                data_component_by_id_and_version[id_str]
                || (data_components_by_id[id_str] || [])[0]
            )


            if (!data_component)
            {
                // console .debug(`Data component with ID ${data_component_id} not found.  Requesting to load it.`)

                data_component = {
                    id: id.id,
                    version: id.version ?? null,
                    component: null,
                    status: "requested",
                }
                const new_data_component = data_component

                set(state =>
                {
                    const by_id = state.data_components.data_components_by_id[id.id] || []
                    by_id.push(new_data_component)
                    state.data_components.data_components_by_id[id.id] = by_id

                    if (id.version !== undefined)
                    {
                        state.data_components.data_component_by_id_and_version[id_str] = new_data_component
                    }
                    return state
                })
            }

            return data_component
        }
    }
}


export function subscriptions(app_store: AppStore)
{

}
