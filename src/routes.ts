import { IdAndVersion, IdOnly } from "core/data/id"


export const ROUTES = {
    HOME: "/",
    DATA_COMPONENT:
    {
        SEARCH: (search_term?: string) => "/wiki/search" + (search_term ? "?q=" + encodeURIComponent(search_term) : ""),
        NEW: (is_user_component?: boolean) => `/new${is_user_component === undefined ? "" :`?is_user_component=${is_user_component}`}`,
        VIEW_WIKI_COMPONENT: (id: IdAndVersion | IdOnly | number | ":data_component_id" = ":data_component_id") =>
        {
            const path = typeof id === "string" ? id
                : typeof id === "number" ? id
                : id.to_str()
            return `/wiki/${path}`
        },
        VIEW_USER_COMPONENT: (args?: { user_id_or_name: string, id: IdAndVersion | IdOnly | number | ":data_component_id" }) =>
        {
            args = args || { user_id_or_name: ":user_id_or_name", id: ":data_component_id" }
            const { user_id_or_name, id } = args

            const path = typeof id === "string" ? id
                : typeof id === "number" ? id
                : id.to_str()
            return `/u/${user_id_or_name}/${path}`
        },
        EDIT: (id: IdOnly | number | ":data_component_id" = ":data_component_id") =>
        {
            const path = typeof id === "string" ? id
                : typeof id === "number" ? id
                : id.to_str_without_version()
            return `/wiki/${path}/edit`
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
