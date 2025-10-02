import { IdAndVersion, IdOnly } from "core/data/id"


interface SearchArgs
{
    search_query?: string
    user_id?: string
}

export const ROUTES = {
    HOME: "/",
    DATA_COMPONENT:
    {
        SEARCH: (args: SearchArgs = {}) => "/wiki/search" + search_args_to_query_string(args),
        NEW: (is_user_component?: boolean) => `/new${is_user_component === undefined ? "" :`?is_user_component=${is_user_component}`}`,
        VIEW_WIKI_COMPONENT: (id: IdAndVersion | IdOnly | number | string = ":data_component_id") =>
        {
            const path = typeof id === "string" ? id
                : typeof id === "number" ? id
                : id.to_str()
            return `/wiki/${path}`
        },
        VIEW_USER_COMPONENT: (args?: { user_id_or_name: string, id: IdAndVersion | IdOnly | string | number }) =>
        {
            args = args || { user_id_or_name: ":user_id_or_name", id: ":data_component_id" }
            const { user_id_or_name, id } = args

            const path = typeof id === "string" ? id
                : typeof id === "number" ? id
                : id.to_str()
            return `/u/${user_id_or_name}/${path}`
        },
        VIEW: (component: { id: IdAndVersion | IdOnly | string | number, owner_id?: string }) =>
        {
            if (component.owner_id)
            {
                return ROUTES.DATA_COMPONENT.VIEW_USER_COMPONENT({ user_id_or_name: component.owner_id, id: component.id })
            }
            else
            {
                return ROUTES.DATA_COMPONENT.VIEW_WIKI_COMPONENT(component.id)
            }
        },
        EDIT: (id: IdOnly | number | ":data_component_id" = ":data_component_id") =>
        {
            const path = typeof id === "string" ? id
                : typeof id === "number" ? id
                : id.to_str_without_version()
            return `/edit/${path}`
        },
        VIEW_VERSION_HISTORY: (id: IdOnly | ":data_component_id" = ":data_component_id") =>
        {
            return `/wiki/${typeof id === "string" ? id : id.to_str_without_version()}/history`
        },
    },
    USER:
    {
        VIEW: (user_id_or_name: string = ":user_id_or_name") =>
        {
            return `/u/${user_id_or_name}`
        },
    },
}


function search_args_to_query_string(args: SearchArgs)
{
    const params = new URLSearchParams()
    if (args.search_query) params.set("q", args.search_query)
    if (args.user_id) params.set("user_id", args.user_id)
    const param_str = params.toString()
    return param_str ? `?${param_str}` : ""
}
