import { useEffect, useState } from "preact/hooks"

import { search_data_components } from "core/data/fetch_from_db"
import { DataComponent } from "core/data/interface"
import { browser_convert_tiptap_to_plain } from "core/rich_text/browser_convert_tiptap_to_plain"
import { get_supabase } from "core/supabase"

import pub_sub from "../../pub_sub"
import Loading from "../../ui_components/Loading"
import "./SearchResults.css"


interface SearchResultsProps
{
    search_term: string
    search_requester_id: string
    on_chosen_search_result: (data: { search_requester_id: string, data_component: DataComponent }) => void
}
export function SearchResults(props: SearchResultsProps)
{
    const { search_requester_id } = props
    const search_term = props.search_term.trim()

    const [search_response, set_search_response] = useState<SearchResultsResponse | undefined>(undefined)
    const [selected_result_index, set_selected_result_index] = useState<number | null>(null)

    const error = search_response?.error
    const results = search_response?.results
    const data_components = results?.data_components || []

    useEffect(() => search_async_api({ search_term, search_requester_id }, set_search_response), [search_term, props.search_requester_id])

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
        // If Enter is pressed, choose the currently selected result
        const result = data_components[selected_result_index]
        if (!result) return
        props.on_chosen_search_result({
            search_requester_id: search_response!.results!.search_requester_id,
            data_component: result,
        })
    }), [data_components, selected_result_index])


    return <div>
        {search_term && (search_term !== results?.search_term
            ? <SearchingFor search_term={search_term} />
            : `Search results for "${results.search_term}"`)
        }

        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        {results?.search_term &&
            (results.data_components.length > 0 ? (
                <div className="search-results-table">
                    {results.data_components.map((row, index) =>
                        <div
                            key={index}
                            className={"result-row " + (selected_result_index === index ? "selected" : "")}
                            onClick={() =>
                            {
                                props.on_chosen_search_result({
                                    search_requester_id: results.search_requester_id,
                                    data_component: row,
                                })
                            }}
                            onPointerMove={() => set_selected_result_index(index)}
                        >
                            {browser_convert_tiptap_to_plain(row.title)}
                            <span style={{ color: "#ccc", fontSize: 13, padding: "4.5px 0 0 5px" }}>
                                id {row.id.id}
                            </span>
                        </div>
                    )}
                </div>
            ) : (
                <p>No results found.</p>
            ))
        }
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
    search_requester_id: string
}
interface SearchResults extends SearchResultsRequest
{
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
    const { search_term, search_requester_id } = request

    const search_start_time = Date.now() // Unique ID for this search
    set_search_response({ error: null, results: { search_term: "", search_requester_id, search_start_time, data_components: [] } })
    if (!search_term) return

    let cancel_search = false

    search_data_components(get_supabase, search_term, { page: 0, size: 20 })
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
            let new_results: SearchResults = {
                search_start_time,
                search_term,
                search_requester_id,
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
