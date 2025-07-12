import { DataComponent } from "core/data/interface"
import { DataComponentIdMaybeVersion } from "../../../lib/core/src/data/id"


interface AsyncDataComponent
{
    id: number
    version: number | null
    component: DataComponent | null
    status: "requested" | "loading" | "error" | "success"
    error?: string
}


export interface DataComponentsState
{
    data_components_by_id: Record<string, AsyncDataComponent[]>
    data_component_by_id_and_version: Record<string, AsyncDataComponent>

    request_data_component: (data_component_id: DataComponentIdMaybeVersion | string) => AsyncDataComponent
}
