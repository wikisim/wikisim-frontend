import { IdAndVersion, IdOnly } from "core/data/id"


export const ROUTES = {
    HOME: "/",
    DATA_COMPONENT:
    {
        VIEW_ALL: () => "/wiki/search",
        NEW: () => "/wiki/new",
        VIEW: (id: IdAndVersion | IdOnly | number | ":data_component_id") =>
        {
            const path = typeof id === "string" ? id
                : typeof id === "number" ? id
                : id.to_str()
            return `/wiki/${path}`
        },
        EDIT: (id: IdOnly | number | ":data_component_id") =>
        {
            const path = typeof id === "string" ? id
                : typeof id === "number" ? id
                : id.to_str_without_version()
            return `/wiki/${path}/edit`
        },
        VIEW_VERSION_HISTORY: (id: IdOnly | ":data_component_id") =>
        {
            return `/wiki/${typeof id === "string" ? id : id.to_str_without_version()}/history`
        },
    },
    USER:
    {
        VIEW: (user_id: string | false) =>
        {
            return `/user/${user_id || ":user_id"}`
        },
    }
}
