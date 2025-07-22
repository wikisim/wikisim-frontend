import { useMemo } from "preact/hooks"

import { IdAndVersion, parse_id } from "core/data/id"

import { ROUTES } from "../../routes"
import { get_async_data_component } from "../../state/data_components/accessor"
import { app_store } from "../../state/store"
import Loading from "../../ui_components/Loading"
import { DataComponentEditForm } from "./DataComponentEditForm"


export function DataComponentPageEdit(props: { data_component_id: string, query: Record<string, string> })
{
    const state1 = app_store()
    useMemo(() =>
    {
        // In case the user has an older version of the data component when they
        // open the edit page, we want to ensure that the latest version is loaded.
        // This is done by calling `get_async_data_component` with the `force_refresh`
        // flag set to true.
        // We only want to call this with the force_refresh flag set to true once.
        // We call it from a useMemo instead of useEffect to ensure it runs
        // immediately when the component mounts.
        // This is because we want to ensure that the async data component is
        // available for the rest of the component to use.
        //
        // Note that you can not move the call to `const state1 = app_store()`
        // into the useMemo, as it makes the other hooks not work properly.
        get_async_data_component(state1, props.data_component_id, true)
    }, [props.data_component_id])

    const state2 = app_store()
    const async_data_component = state2.data_components.data_component_by_id_and_maybe_version[props.data_component_id]!
    const { component, status } = async_data_component


    const parsed_id = parse_id(props.data_component_id)
    if (parsed_id instanceof IdAndVersion)
    {
        return <div className="page-container">
            <p>Can only edit latest version of component.  Can not edit component with version in ID.</p>
            <p>Use the <a href={ROUTES.DATA_COMPONENT.EDIT(parsed_id)}>edit page</a> to edit the latest version of this component.</p>
        </div>
    }
    else if (!component || status === "loading")
    {
        return <div className="page-container">
            {status === "loading" ? <div>Loading data component<Loading/></div>
            : status === "error" ? <div>Error loading data component.</div>
            : <div>Data component not found.</div>}
        </div>
    }

    return <DataComponentEditForm data_component={component} />
}
