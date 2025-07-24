import { useEffect, useState } from "preact/hooks"

import { search_data_components } from "core/data/fetch_from_db"
import { DataComponent } from "core/data/interface"
import { convert_tiptap_text_to_plain_text } from "core/rich_text/editor"
import { get_supabase } from "core/supabase"

import Loading from "../../ui_components/Loading"


interface SearchResultsProps
{
    search_term: string
    search_requester_id: string
    on_chosen_search_result: (data: { search_requester_id: string, data_component_id: number }) => void
}
export function SearchResults(props: SearchResultsProps)
{
    const { search_requester_id } = props
    const search_term = props.search_term.trim()

    const [search_response, set_search_response] = useState<SearchResultsResponse | undefined>(undefined)

    useEffect(() => search_async_api({ search_term, search_requester_id }, set_search_response), [search_term, props.search_requester_id])

    const results = search_response?.results
    const error = search_response?.error

    return <div>
        {search_term && (search_term !== results?.search_term
            ? <SearchingFor search_term={search_term} />
            : `Search results for "${results.search_term}"`)
        }

        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        {results?.search_term &&
            (results.data_components.length > 0 ? (
                <table>
                    {results.data_components.map((row, index) =>
                        <tr
                            key={index}
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                            {
                                props.on_chosen_search_result({
                                    search_requester_id: results.search_requester_id,
                                    data_component_id: row.id.id,
                                })
                            }}
                        >
                            <td>{convert_tiptap_text_to_plain_text(row.title)}</td>
                            <td style={{ color: "#ccc", fontSize: 13, paddingTop: 4.5 }}>
                                id {row.id.id}
                            </td>
                        </tr>
                    )}
                </table>
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
