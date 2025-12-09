import { useLocation } from "preact-iso"
import { useCallback, useEffect, useState } from "preact/hooks"

import { ROUTES } from "../routes"
import { local_storage } from "../state/local_storage"
import { app_store } from "../state/store"
import { TextEditorV1 } from "../text_editor/TextEditorV1"
import Loading from "../ui_components/Loading"
import { SearchResults } from "../ui_components/search/SearchResults"
import { set_page_title } from "../ui_components/set_page_title"
import { ToggleTwo } from "../ui_components/ToggleTwo"
import { debounce } from "../utils/debounce"
import "./DataComponentsSearchPage.css"


export function DataComponentsSearchPage()
{
    useEffect(() => set_page_title("Search"), [])

    const location = useLocation()

    const initial_search_term = location.query["q"] || ""
    const initial_user_id = location.query["user_id"] || ""

    const [search_term, _set_search_term] = useState(initial_search_term)
    const search_requester_id = "data_components_search_page"

    const [filter_by_user_id, set_filter_by_user_id] = useState<string | undefined>(
        initial_user_id
        || local_storage.get_search_filter_by_user_id()
        || undefined
    )
    local_storage.set_search_filter_by_user_id(filter_by_user_id || "")
    // Update URL to reflect current state
    history.replaceState({}, "", ROUTES.DATA_COMPONENT.SEARCH({ search_query: search_term, user_id: filter_by_user_id }))


    const set_search_term = useCallback(debounce((search_query: string) =>
    {
        _set_search_term(search_query)
        // Update the URL query parameter
        history.pushState({}, "", ROUTES.DATA_COMPONENT.SEARCH({ search_query }))
    }, 500), [_set_search_term])


    return (
        <div className="page-container">

            <TextEditorV1
                editable={true}
                initial_content={search_term}
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
                filter_by_owner_id={filter_by_user_id || undefined}
                search_requester_id={search_requester_id}
                on_chosen_search_result={data =>
                {
                    location.route(ROUTES.DATA_COMPONENT.VIEW_WIKI_COMPONENT(data.data_component.id.as_IdOnly()))
                }}
                search_type="search_page"
            />
        </div>
    )
}


interface ToggleFilterByUserProps
{
    filter_by_user_id: string | undefined
    set_filter_by_user_id: (user_id: string) => void
}
function ToggleFilterByUser(props: ToggleFilterByUserProps)
{
    const { filter_by_user_id, set_filter_by_user_id } = props

    const state = app_store()
    const user_signed_in = state.user_auth_session.session?.user

    const toggle_filter_by_user_id = useCallback(() =>
    {
        if (filter_by_user_id) set_filter_by_user_id("")
        else if (user_signed_in?.id) set_filter_by_user_id(user_signed_in.id)
    }, [filter_by_user_id, set_filter_by_user_id, user_signed_in])


    const other_user_id = filter_by_user_id && user_signed_in?.id !== filter_by_user_id ? filter_by_user_id : undefined
    const async_other_user = other_user_id ? state.users.request_user(other_user_id) : undefined

    const filter_by_user_message = filter_by_user_id
        ? (user_signed_in?.id === filter_by_user_id
            ? "Showing only your pages"
            : <>Showing only pages of {async_other_user?.user?.name || <Loading/>}</>)
        : "Showing all pages (wiki, yours and other users)"


    return <ToggleTwo
        active={!!filter_by_user_id}
        disabled={!user_signed_in && !filter_by_user_id}
        label={() => filter_by_user_message}
        set_active={toggle_filter_by_user_id}
    />
}
