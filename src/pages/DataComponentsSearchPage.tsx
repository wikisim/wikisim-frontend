import { useLocation } from "preact-iso"
import { useCallback, useEffect } from "preact/hooks"

import { FilterByOwnerId } from "core/data/fetch_from_db"

import { ROUTES } from "../routes"
import { local_storage } from "../state/local_storage"
import { TextEditorV1 } from "../text_editor/TextEditorV1"
import { SearchResults } from "../ui_components/search/SearchResults"
import { ToggleFilterByUser } from "../ui_components/search/ToggleFilterByUser"
import { set_page_title } from "../ui_components/set_page_title"
import { debounce } from "../utils/debounce"
import "./DataComponentsSearchPage.css"


export function DataComponentsSearchPage()
{
    useEffect(() => set_page_title("Search"), [])

    const location = useLocation()

    // Update the search term and user filter id when the user uses the browser
    // navigation buttons to go back/forward.
    const search_term = location.query["q"] || ""
    const filter_by_user_id = location.query["user_id"] || ""

    local_storage.set_search_only_user_pages(!!filter_by_user_id)

    const set_filter_by_user_id = useCallback((filter_by_user_id: string) =>
    {
        location.route(ROUTES.DATA_COMPONENT.SEARCH({
            search_query: search_term,
            user_id: filter_by_user_id,
        }))
    }, [location, filter_by_user_id])


    const set_search_term = useCallback(debounce((search_query: string) =>
    {
        location.route(ROUTES.DATA_COMPONENT.SEARCH({
            search_query,
            user_id: filter_by_user_id,
        }))
    }, 500), [location, filter_by_user_id])


    const filter_by_owner_id: FilterByOwnerId = filter_by_user_id
        ? { type: "only_user", owner_id: filter_by_user_id }
        // We could use only_wiki here if there's too much unrelated user content
        : { type: "include_all" }


    return (
        <div className="page-container">

            <TextEditorV1
                editable={true}
                initial_content={search_term}
                content={search_term}
                on_change={e => set_search_term(e.currentTarget.value)}
                on_key_down={e =>
                {
                    // Without this, pressing down arrow and then Escape or up
                    // arrow to exit selecting a result, and then pressing Enter
                    // would cause a result to be selected and navigated to.
                    if (e.key === "Enter")
                    {
                        e.preventDefault()
                        e.stopImmediatePropagation()
                    }
                }}
                label="Search for..."
                single_line={true}
                start_focused="focused_and_text_selected"
                trigger_search_on_at_symbol={false}
            />

            <div class="vertical-gap" />

            <ToggleFilterByUser
                filter_by_user_id={filter_by_user_id}
                set_filter_by_user_id={set_filter_by_user_id}
            />

            <div class="vertical-gap" />

            <SearchResults
                search_term={search_term}
                use_empty_search_term={true}
                filter_by_owner_id={filter_by_owner_id}
                search_requester_id="data_components_search_page"
                on_chosen_search_result={data =>
                {
                    location.route(ROUTES.DATA_COMPONENT.VIEW_WIKI_COMPONENT(data.data_component.id.as_IdOnly()))
                }}
                search_type="search_page"
            />
        </div>
    )
}
