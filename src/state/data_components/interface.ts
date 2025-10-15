import { IdAndMaybeVersion, IdAndVersion, IdOnly, TempId } from "core/data/id"
import { DataComponent, NewDataComponent } from "core/data/interface"


type BasicLoadingStatus = "loading" | "error" | "loaded"
type LoadingStatus = BasicLoadingStatus | "not_found"
type SavingStatus = "saving" | "error" | "loaded"

export type AsyncDataComponentStatus = LoadingStatus | SavingStatus
export interface AsyncDataComponent
{
    id: IdAndMaybeVersion
    component: DataComponent | null
    status: AsyncDataComponentStatus
    error?: string | Error
}

export interface AsyncDataComponentIdsForHomePage
{
    fetched: Date
    status: BasicLoadingStatus
    error?: Error
    ids?: IdAndVersion[]
    // newer_ids?: IdAndVersion[]
}


export type CheckIfIdIsLatestResponse = {
    is_latest: true, latest_version: null, error: null
} | {
    is_latest: false, latest_version: IdAndVersion, error: null
} | {
    is_latest: null, latest_version: null, error: Error
}


export interface AsyncNewDataComponent
{
    temporary_id: TempId
    new_id?: IdAndVersion
    status: SavingStatus
    error?: string
}

export type UpsertDataComponentResult = { error: string, id: undefined } | { error: undefined, id: IdAndVersion }

export interface DataComponentsState
{
    // data_component_ids_to_load: IdAndMaybeVersion[]
    data_component_ids_for_home_page: AsyncDataComponentIdsForHomePage | undefined
    new_data_component_by_temp_id: Record<string, AsyncNewDataComponent>
    data_component_by_id_and_maybe_version: Record<string, AsyncDataComponent>

    request_data_component_error: Error | undefined
    request_data_component: (data_component_id: IdAndMaybeVersion, force_refresh?: boolean) => AsyncDataComponent
    request_data_components: (data_component_ids: IdAndMaybeVersion[]) => AsyncDataComponent[]
    request_data_components_for_home_page: () => void
    request_data_component_history: (data_component_id: IdOnly, page: number, page_size: number, force_refresh?: boolean) => void
    request_check_if_id_is_latest: (data_component_id: string | IdAndMaybeVersion) => Promise<CheckIfIdIsLatestResponse>

    insert_data_component: (data_component: NewDataComponent) => Promise<UpsertDataComponentResult>
    update_data_component: (data_component: DataComponent) => Promise<UpsertDataComponentResult>
}


export interface DataComponentsById
{
    [id: string]: DataComponent
}
