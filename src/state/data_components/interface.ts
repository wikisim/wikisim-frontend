import { IdAndMaybeVersion, IdAndVersion, IdOnly } from "core/data/id"
import { DataComponent } from "core/data/interface"


export interface AsyncDataComponent
{
    id: IdOnly | IdAndVersion
    component: DataComponent | null
    status: "requested" | "loading" | "error" | "loaded" | "not_found"
    error?: string
}


export interface DataComponentsState
{
    data_component_ids_to_load: (IdOnly | IdAndVersion)[]
    data_component_by_id_and_maybe_version: Record<string, AsyncDataComponent>

    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    request_data_component_error: any | undefined
    request_data_component: (data_component_id: IdAndMaybeVersion | string) => AsyncDataComponent
}
