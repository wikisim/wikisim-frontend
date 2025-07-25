import { useLocation } from "preact-iso"
import { useCallback, useState } from "preact/hooks"

import { ROUTES } from "../routes"
import { TextEditorV1 } from "../text_editor/TextEditorV1"
import { SearchResults } from "../ui_components/search/SearchResults"
import { debounce } from "../utils/debounce"
import "./DataComponentsSearchPage.css"


export function DataComponentsSearchPage()
{
    const location = useLocation()
    const initial_search_term = location.query["q"] || ""
    const [search_term, _set_search_term] = useState(initial_search_term)
    const search_requester_id = "data_components_search_page"

    const set_search_term = useCallback(debounce((term: string) =>
    {
        _set_search_term(term)
        // Update the URL query parameter
        history.pushState({}, "", ROUTES.DATA_COMPONENT.SEARCH(term))
    }, 1500), [_set_search_term, location])

    return (
        <div className="page-container">

            <TextEditorV1
                editable={true}
                value={search_term}
                on_change={e => set_search_term(e.currentTarget.value)}
                label="Search for..."
                single_line={true}
                start_focused="focused_and_text_selected"
                trigger_search_on_at_symbol={false}
            />

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
