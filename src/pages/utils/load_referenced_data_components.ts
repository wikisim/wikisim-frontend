import { useMemo } from "preact/hooks"

import { DataComponent, NewDataComponent } from "core/data/interface"
import {
    browser_get_referenced_ids_from_tiptap,
} from "core/rich_text/browser_get_referenced_ids_from_tiptap"

import { RootAppState } from "../../state/interface"


interface LoadReferencedDataComponentsResult
{
    status: "loading" | "loaded" //| "error"
    loading_count: number
    referenced_data_component_count: number
    referenced_data_components: Record<string, DataComponent>
}
export function load_referenced_data_components(state: RootAppState, data_component: DataComponent | NewDataComponent): LoadReferencedDataComponentsResult
{
    const referenced_data_component_ids = useMemo(() =>
    {
        return browser_get_referenced_ids_from_tiptap(data_component.input_value || "")
    }, [data_component.input_value])

    const async_referenced_data_components = useMemo(() =>
    {
        return state.data_components.request_data_components(referenced_data_component_ids)
    }, [referenced_data_component_ids, state.data_components.data_component_by_id_and_maybe_version])

    const loading = async_referenced_data_components.filter(async_data_component => async_data_component.status === "loading")

    const referenced_data_component_count = referenced_data_component_ids.length
    const loading_count = loading.length
    const status = loading_count > 0 ? "loading" : "loaded"

    const referenced_data_components: Record<string, DataComponent> = {}
    async_referenced_data_components.forEach(async_data_component =>
    {
        const { component } = async_data_component
        if (async_data_component.status === "loaded" && component)
        {
            referenced_data_components[component.id.to_str()] = component
        }
    })

    return {
        status,
        loading_count,
        referenced_data_component_count,
        referenced_data_components,
    }
}
