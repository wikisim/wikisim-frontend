import { Button } from "@mantine/core"
import { useEffect, useState } from "preact/hooks"

import { search_data_components } from "core/data/fetch_from_db"
import type { DataComponent } from "core/data/interface"
import { browser_convert_tiptap_to_plain } from "core/rich_text/browser_convert_tiptap_to_plain"
import { get_supabase } from "core/supabase/browser"

import pub_sub from "../../pub_sub"
import { ROUTES } from "../../routes"
import Loading from "../../ui_components/Loading"
import "./SearchResults.css"


interface SearchResultsProps
{
    search_term: string
    use_empty_search_term?: boolean
    filter_by_owner_id?: string
    search_requester_id: string
    on_chosen_search_result: (data: { search_requester_id: string, data_component: DataComponent }) => void
    search_type: "search_page" | "search_modal"
}
export function SearchResults(props: SearchResultsProps)
{
    const {
        search_requester_id,
        use_empty_search_term = false,
        filter_by_owner_id,
        search_type,
    } = props
    const search_term = props.search_term.trim()

    const [search_response, set_search_response] = useState<SearchResultsResponse | undefined>(undefined)
    const [selected_result_index, set_selected_result_index] = useState<number | null>(null)
    const [page, set_page] = useState<number>(0)
    const [page_size, _] = useState<number>(20)

    const error = search_response?.error
    const results = search_response?.results
    const data_components = results?.data_components || []

    useEffect(() => search_async_api({
        search_term,
        page,
        page_size,
        use_empty_search_term,
        filter_by_owner_id,
        search_requester_id,
    }, set_search_response), [search_term, page, page_size, filter_by_owner_id, props.search_requester_id])

    useEffect(() => {
        // When props.search_term changes, reset the selected result index
        set_selected_result_index(null)
    }, [props.search_term])

    // Allow arrow keys to navigate results
    const number_of_results = data_components.length
    useEffect(() => pub_sub.sub("key_down", data =>
    {
        if (number_of_results === 0) return

        let direction = 0
        if (data.key === "ArrowDown") direction = 1
        else if (data.key === "ArrowUp") direction = -1
        else return

        let next_index = (selected_result_index ?? -1) + direction
        if (next_index < 0) next_index = number_of_results - 1
        else if (next_index >= number_of_results) next_index = 0


        set_selected_result_index(next_index)
    }), [number_of_results, selected_result_index])


    // Allow Enter key to act like clicking on result
    useEffect(() => pub_sub.sub("key_down", data =>
    {
        if (data_components.length === 0) return

        if (data.key !== "Enter" || selected_result_index === null) return
        // We prevent "Enter" from doing anything else.  For example without
        // this `preventDefault` then when the reference is inserted into the
        // CodeEditor, the CodeEditor would also see the "Enter" and
        // insert a newline.
        data.event.preventDefault()
        data.event.stopImmediatePropagation()

        // If Enter is pressed, choose the currently selected result
        const result = data_components[selected_result_index]
        if (!result) return
        props.on_chosen_search_result({
            search_requester_id: search_response!.results!.search_requester_id,
            data_component: result,
        })
    }), [data_components, selected_result_index])

    const main_classname = search_type === "search_page" ? "search-results-page" : "search-results-modal"

    return <div className={main_classname}>
        {(search_term || props.use_empty_search_term) && (search_term !== results?.search_term
            ? <SearchingFor search_term={search_term} />
            : ("Search results " + (search_term ? `for "${results.search_term}"` : "")))
        }

        <div class="vertical-gap" />

        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        {results && (results.search_term || props.use_empty_search_term) &&
            (results.data_components.length > 0 ? (
                <div className="search-results-table">
                    {results.data_components.slice(0, page_size).map((row, index) =>
                        <a
                            key={index}
                            href={ROUTES.DATA_COMPONENT.VIEW({
                                id: row.id.as_IdOnly(),
                                owner_id: row.owner_id,
                            })}
                            onClick={e =>
                            {
                                e.preventDefault()
                                e.stopImmediatePropagation()
                                props.on_chosen_search_result({
                                    search_requester_id: results.search_requester_id,
                                    data_component: row,
                                })
                            }}

                            className={"result-row " + (selected_result_index === index ? "selected" : "")}
                            onPointerMove={() => set_selected_result_index(index)}
                        >
                            {browser_convert_tiptap_to_plain(row.title)}
                            <span style={{ color: "#ccc", fontSize: 13, padding: "4.5px 0 0 5px" }}>
                                id {row.id.id}
                            </span>
                        </a>
                    )}
                </div>
            ) : (
                <p>No results found.</p>
            ))
        }

        <div class="vertical-gap" />

        {results && <>
            <div>
                Page {page + 1} (showing result {page * page_size + 1} to {page * page_size + Math.min(page_size, results.data_components.length)})
            </div>
            <div class="vertical-gap" />
        </>}

        <div style={{ display: "flex", gap: "var(--hgap-mid)" }}>
            <Button
                disabled={page === 0}
                size="md"
                variant="primary"
                onClick={() => set_page(page - 1)}
            >
                Previous Page
            </Button>
            <Button
                disabled={(results?.data_components.length || 0) <= page_size}
                size="md"
                variant="primary"
                onClick={() => set_page(page + 1)}
            >
                Next Page
            </Button>
        </div>
    </div>
}


function SearchingFor({ search_term }: { search_term: string })
{
    return <span>
        Searching for "{search_term}" <Loading />
    </span>
}


interface SearchResultsRequest
{
    search_term: string
    page: number
    page_size: number
    use_empty_search_term: boolean
    filter_by_owner_id: string | undefined
    search_requester_id: string
}
interface SearchResults
{
    search_term: string | undefined
    search_requester_id: string
    search_start_time: number
    data_components: DataComponent[]
}
type SearchResultsResponse =
{
    error: null
    results: SearchResults
} | {
    error: Error
    results: null
}
type SetSearchResponse = (fn_or_value: SearchResultsResponse | ((current_response: SearchResultsResponse | undefined) => SearchResultsResponse)) => void
function search_async_api(request: SearchResultsRequest, set_search_response: SetSearchResponse)
{
    const {
        search_term,
        page,
        page_size,
        use_empty_search_term,
        filter_by_owner_id,
        search_requester_id,
    } = request

    const search_start_time = Date.now() // Unique ID for this search
    if (!search_term && !use_empty_search_term)
    {
        set_search_response({
            error: null,
            results: {
                search_term: undefined,
                search_requester_id,
                search_start_time,
                data_components: [],
            },
        })
        return
    }

    let cancel_search = false

    search_data_components(get_supabase, search_term, { page, size: page_size + 1, filter_by_owner_id })
    .then(({ data, error }) =>
    {
        if (cancel_search) return
        if (error)
        {
            console.error("Error searching data components:", error)
            set_search_response({ error, results: null })
            return
        }
        set_search_response(current_results_response =>
        {
            const new_results: SearchResults = {
                search_term,
                search_requester_id,
                search_start_time,
                data_components: data,
            }

            if (current_results_response?.results && current_results_response.results.search_start_time > new_results.search_start_time)
            {
                // Keep the current results if they are newer
                return current_results_response
            }

            return { error: null, results: new_results }
        })
    })

    return () => cancel_search = true
}
