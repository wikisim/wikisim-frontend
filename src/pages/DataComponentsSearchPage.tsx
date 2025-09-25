import { useLocation } from "preact-iso"
import { useCallback, useState } from "preact/hooks"

import { ROUTES } from "../routes"
import { app_store } from "../state/store"
import { TextEditorV1 } from "../text_editor/TextEditorV1"
import { SearchResults } from "../ui_components/search/SearchResults"
import { ToggleTwo } from "../ui_components/ToggleTwo"
import { debounce } from "../utils/debounce"
import "./DataComponentsSearchPage.css"


export function DataComponentsSearchPage()
{
    const location = useLocation()
    const state = app_store()

    const initial_search_term = location.query["q"] || ""
    const [search_term, _set_search_term] = useState(initial_search_term)
    const search_requester_id = "data_components_search_page"

    const user_signed_in = state.user_auth_session.session?.user
    const [filter_by_user, set_filter_by_user] = useState(localStorage.getItem("data_components_search_page_filter_by_user") === "true")
    localStorage.setItem("data_components_search_page_filter_by_user", filter_by_user.toString())

    const set_search_term = useCallback(debounce((term: string) =>
    {
        _set_search_term(term)
        // Update the URL query parameter
        history.pushState({}, "", ROUTES.DATA_COMPONENT.SEARCH(term))
    }, 500), [_set_search_term, location])


    return (
        <div className="page-container">

            <TextEditorV1
                editable={true}
                initial_content={search_term}
                on_change={e => set_search_term(e.currentTarget.value)}
                label="Search for..."
                single_line={true}
                start_focused="focused_and_text_selected"
                trigger_search_on_at_symbol={false}
            />

            <div class="vertical-gap" />

            {user_signed_in && <ToggleTwo
                active={filter_by_user}
                label={active => active ? "Only your pages" : "All pages (Wiki, yours and others)"}
                set_active={set_filter_by_user}
            />}

            <div class="vertical-gap" />

            <SearchResults
                search_term={search_term}
                use_empty_search_term={true}
                filter_by_owner_id={filter_by_user ? state.user_auth_session.session?.user.id : undefined}
                search_requester_id={search_requester_id}
                on_chosen_search_result={data =>
                {
                    location.route(ROUTES.DATA_COMPONENT.VIEW_WIKI_COMPONENT(data.data_component.id))
                }}
            />
        </div>
    )
}
