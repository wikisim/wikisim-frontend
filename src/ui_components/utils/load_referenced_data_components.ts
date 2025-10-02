import { useMemo } from "preact/hooks"

import { IdAndVersion } from "core/data/id"
import { DataComponent, NewDataComponent } from "core/data/interface"
import {
    browser_get_referenced_ids_from_tiptap,
} from "core/rich_text/browser_get_referenced_ids_from_tiptap"

import { RootAppState } from "../../state/interface"


interface AsyncLoadReferencedDataComponentsResult
{
    status: "loading" | "loaded" | "error"
    error: string | undefined
    loading_count: number
    referenced_data_component_ids: IdAndVersion[]
    referenced_data_components_by_id_str: Record<string, DataComponent>
}
export function load_referenced_data_components(state: RootAppState, data_component: DataComponent | NewDataComponent): AsyncLoadReferencedDataComponentsResult
{
    let error: string | undefined = undefined

    const referenced_data_component_ids = useMemo(() =>
    {
        let ids: IdAndVersion[] = []
        try
        {
            ids = browser_get_referenced_ids_from_tiptap(data_component.input_value || "")
        }
        catch (e)
        {
            error = (e as Error).message
        }

        return ids
    }, [data_component.input_value])

    const async_referenced_data_components = useMemo(() =>
    {
        return state.data_components.request_data_components(referenced_data_component_ids)
    }, [referenced_data_component_ids, state.data_components.data_component_by_id_and_maybe_version])

    const loading = async_referenced_data_components.filter(async_data_component => async_data_component.status === "loading")

    const loading_count = loading.length
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const status = error ? "error" : (loading_count > 0 ? "loading" : "loaded")

    const referenced_data_components_by_id_str: Record<string, DataComponent> = {}
    async_referenced_data_components.forEach(async_data_component =>
    {
        const { component } = async_data_component
        if (async_data_component.status === "loaded" && component)
        {
            referenced_data_components_by_id_str[component.id.to_str()] = component
        }
    })

    return {
        status,
        error,
        loading_count,
        referenced_data_component_ids,
        referenced_data_components_by_id_str,
    }
}
