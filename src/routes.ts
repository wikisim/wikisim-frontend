import { IdAndVersion, IdOnly } from "core/data/id"


interface SearchArgs
{
    search_query?: string
    user_id?: string
}

export interface NewDataComponentArgs
{
    is_user_component?: boolean
    subject_id?: number
    according_to_id?: number
}

export const ROUTES = {
    HOME: "/",
    DATA_COMPONENT:
    {
        SEARCH: (args: SearchArgs = {}) => "/wiki/search" + search_args_to_query_string(args),
        NEW: (args: NewDataComponentArgs = {}) =>
        {
            const arg_strs: Record<string, string> = {}
            if (args.is_user_component) arg_strs.is_user_component = "true"
            if (args.subject_id) arg_strs.subject_id = args.subject_id.toString()
            if (args.according_to_id) arg_strs.according_to_id = args.according_to_id.toString()

            const params = new URLSearchParams(arg_strs)
            let query_string = params.toString()
            // e.g.  "?is_user_component=true&subject_id=123&according_to_id=456"
            query_string = query_string ? `?${query_string}` : ""

            return `/new` + query_string
        },
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
        VIEW_ALTERNATIVES: (id: IdOnly | ":data_component_id" = ":data_component_id") =>
        {
            return `/wiki/${typeof id === "string" ? id : id.to_str_without_version()}/alternatives`
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
