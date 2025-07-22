import { IdAndMaybeVersion, IdAndVersion } from "core/data/id"
import { DataComponent } from "core/data/interface"


type BasicLoadingStatus = "loading" | "error" | "loaded"
type LoadingStatus = BasicLoadingStatus | "not_found"
type SavingStatus = "saving" | "error" | "loaded"

export type AsyncDataComponentStatus = LoadingStatus | SavingStatus
export interface AsyncDataComponent
{
    id: IdAndMaybeVersion
    component: DataComponent | null
    status: AsyncDataComponentStatus
    error?: Error
}

export interface AsyncDataComponentIdsForHomePage
{
    fetched: Date
    status: BasicLoadingStatus
    error?: Error
    ids?: IdAndVersion[]
    // newer_ids?: IdAndVersion[]
}


export interface DataComponentsState
{
    // data_component_ids_to_load: IdAndMaybeVersion[]
    data_component_ids_for_home_page: AsyncDataComponentIdsForHomePage | undefined
    data_component_by_id_and_maybe_version: Record<string, AsyncDataComponent>

    request_data_component_error: Error | undefined
    request_data_component: (data_component_id: IdAndMaybeVersion, force_refresh?: boolean) => AsyncDataComponent
    request_data_components_for_home_page: () => void
    update_data_component: (data_component: DataComponent) => AsyncDataComponent
}
