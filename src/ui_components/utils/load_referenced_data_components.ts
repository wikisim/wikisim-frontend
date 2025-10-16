import { useMemo } from "preact/hooks"

import { IdAndVersion, OrderedUniqueIdAndVersionList } from "core/data/id"
import { DataComponent, NewDataComponent } from "core/data/interface"
import {
    browser_get_referenced_ids,
} from "core/rich_text/browser_get_referenced_ids"

import { AsyncDataComponent } from "../../state/data_components/interface"
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

    const partial_referenced_data_component_ids = useMemo(() =>
    {
        let ids: IdAndVersion[] = []
        try
        {
            ids = browser_get_referenced_ids(data_component)
        }
        catch (e)
        {
            error = (e as Error).message
        }

        return ids
    }, [data_component.input_value])


    // Request the direct (parent) dependencies first, this will be a partial
    // list of all the dependencies needed
    const async_partial_referenced_data_components = useMemo(() =>
    {
        // console .log("Requesting partial referenced data components", partial_referenced_data_component_ids.map(id => id.to_str()).join(", "))
        return state.data_components.request_data_components(partial_referenced_data_component_ids)
    }, [partial_referenced_data_component_ids, state.data_components.data_component_by_id_and_maybe_version])

    const result1 = process_async_data_components(async_partial_referenced_data_components, error)
    const { components_by_id_str: partial_referenced_data_components_by_id_str } = result1
    error = result1.error


    const ids_set = new OrderedUniqueIdAndVersionList()
    ids_set.add_multiple(partial_referenced_data_component_ids)
    // Load the grandparent components too, this will complete the recursion
    // to its full depth
    const grand_parent_ids: IdAndVersion[] = Object.values(partial_referenced_data_components_by_id_str)
        .map(c => c.recursive_dependency_ids || []).flat()
    ids_set.add_multiple(grand_parent_ids)

    const all_referenced_data_component_ids = ids_set.get_all()
    const async_all_referenced_data_components = useMemo(() =>
    {
        // console .log("Requesting all referenced data components", all_referenced_data_component_ids.map(id => id.to_str()).join(", "))
        return state.data_components.request_data_components(all_referenced_data_component_ids)
    }, [all_referenced_data_component_ids.length, state.data_components.data_component_by_id_and_maybe_version])


    const result2 = process_async_data_components(async_all_referenced_data_components, error)
    const { components_by_id_str: all_referenced_data_components_by_id_str } = result2
    error = result2.error


    const loading = async_all_referenced_data_components.filter(async_data_component => async_data_component.status === "loading")
    const loading_count = loading.length
    const status = error ? "error" : (loading_count > 0 ? "loading" : "loaded")

    return {
        status,
        error,
        loading_count,
        referenced_data_component_ids: all_referenced_data_component_ids,
        referenced_data_components_by_id_str: all_referenced_data_components_by_id_str,
    }
}


function process_async_data_components(async_referenced_data_components: AsyncDataComponent[], error: string | undefined)
{
    const components_by_id_str: Record<string, DataComponent> = {}
    async_referenced_data_components.forEach(async_data_component => {
        const { component } = async_data_component
        if (async_data_component.status === "loaded" && component) {
            components_by_id_str[component.id.to_str()] = component
        }
        else if (async_data_component.status === "error") {
            error = typeof async_data_component.error === "string"
                ? async_data_component.error
                : async_data_component.error?.message ?? "Unknown error"
        }
    })
    return { components_by_id_str, error }
}
