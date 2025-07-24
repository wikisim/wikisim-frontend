import { useLocation } from "preact-iso"
import { useState } from "preact/hooks"

import { ROUTES } from "../routes"
import { SearchResults } from "../ui_components/search/SearchResults"


export function DataComponentsSearchPage()
{
    const location = useLocation()
    const initial_search_term = location.query["q"] || ""
    const [search_term, _set_search_term] = useState(initial_search_term)
    const search_requester_id = "data_components_search_page"

    return (
        <div className="page-container">
            <h2>Search results for "{search_term}"</h2>

            <SearchResults
                search_term={search_term}
                search_requester_id={search_requester_id}
                on_chosen_search_result={data =>
                {
                    location.route(ROUTES.DATA_COMPONENT.VIEW(data.data_component_id))
                }}
            />
        </div>
    )
}
