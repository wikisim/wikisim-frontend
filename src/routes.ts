import { IdAndVersion, IdOnly } from "../lib/core/src/data/id"


export const ROUTES = {
    HOME: "/",
    DATA_COMPONENT: {
        VIEW_ALL: () => "/wiki/search",
        NEW: () => "/wiki/new",
        VIEW: (id: IdAndVersion | IdOnly | ":data_component_id") =>
        {
            return `/wiki/${typeof id === "string" ? id : id.to_str()}`
        },
        EDIT: (id: IdAndVersion | IdOnly | ":data_component_id") =>
        {
            return `/wiki/${typeof id === "string" ? id : id.to_str_without_version()}/edit`
        },
        VIEW_VERSION_HISTORY: (id: IdAndVersion | IdOnly | ":data_component_id") =>
        {
            return `/wiki/${typeof id === "string" ? id : id.to_str_without_version()}/history`
        },
    }
}
