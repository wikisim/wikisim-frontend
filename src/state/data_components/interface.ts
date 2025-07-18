import { IdAndMaybeVersion, IdAndVersion } from "core/data/id"
import { DataComponent } from "core/data/interface"


type BasicLoadingStatus = "loading" | "error" | "loaded"
type LoadingStatus = "requested" | BasicLoadingStatus | "not_found"
export interface AsyncDataComponent
{
    id: IdAndMaybeVersion
    component: DataComponent | null
    status: LoadingStatus
    error?: string
}

export interface DataComponentIdsForHomePage
{
    fetched: Date
    status: BasicLoadingStatus
    error?: string
    ids?: IdAndVersion[]
    // newer_ids?: IdAndVersion[]
}


export interface DataComponentsState
{
    data_component_ids_to_load: IdAndMaybeVersion[]
    data_component_ids_for_home_page: DataComponentIdsForHomePage | undefined
    data_component_by_id_and_maybe_version: Record<string, AsyncDataComponent>

    request_data_component_error: Error | undefined
    request_data_component: (data_component_id: IdAndMaybeVersion) => AsyncDataComponent
    request_data_components: () => void
}
