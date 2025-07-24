import { Modal } from "@mantine/core"
import { useEffect, useMemo, useState } from "preact/hooks"

import { search_data_components } from "core/data/fetch_from_db"
import { get_supabase } from "core/supabase"

import { convert_tiptap_text_to_plain_text } from "../../lib/core/src/rich_text/editor"
import pub_sub from "../pub_sub"
import Loading from "../ui_components/Loading"
import { is_mobile_device } from "../utils/is_mobile_device"
import { TextEditorV1 } from "./TextEditorV1"


export function SearchModal()
{
    const [search_window_is_open, set_search_window_is_open] = useState(false)
    const [search_term, set_search_term] = useState("")
    const [search_requester_id, set_search_requester_id] = useState("")
    const trimmed_search_term = search_term.trim()

    useEffect(() => {
        const unsubscribe = pub_sub.sub("search_for_reference", ({ search_requester_id }) => {
            console.debug("search_for_reference event received", { search_requester_id })
            set_search_window_is_open(true)
            set_search_requester_id(search_requester_id)
        })
        // Cleanup function to unsubscribe when the component unmounts
        return unsubscribe
    }, [])

    const throttle_set_search_term = useMemo(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null
        return (term: string) => {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => {
                set_search_term(term)
                timeout = null
            }, 300) // Throttle to 300ms
        }
    }, [])


    const on_mobile = is_mobile_device()


    return <Modal
        opened={search_window_is_open}
        onClose={() => set_search_window_is_open(false)}
        title="Search"
        zIndex={1000}
    >
        {search_window_is_open && <div>
            <TextEditorV1
                editable={true}
                label=""
                value={search_term}
                on_change={e => throttle_set_search_term(e.currentTarget.value)}
                single_line={true}
                // This is a hack to ensure the search modal is shown on the
                // screen otherwise it is mostly hidden off the top of the screen
                start_focused={on_mobile ? false : "focused_and_text_selected"}
                trigger_search_on_at_symbol={false}
            />

            <SearchResults
                search_term={trimmed_search_term}
                search_requester_id={search_requester_id}
                on_chosen_search_result={data =>
                {
                    pub_sub.pub("search_for_reference_completed", data)
                    set_search_window_is_open(false)
                    set_search_requester_id("")
                }}
            />
        </div>}

    </Modal>
}


interface SearchResultsProps
{
    search_term: string
    search_requester_id: string
    on_chosen_search_result: (data: { search_requester_id: string, data_component_id: number }) => void
}
function SearchResults(props: SearchResultsProps)
{
    const search_term = props.search_term.trim()

    const [error, set_error] = useState<string | undefined>(undefined)
    const [results, set_results] = useState<SearchResults | undefined>(undefined)


    useEffect(() => {
        const search_start_time = Date.now() // Unique ID for this search

        set_results(undefined)
        if (!search_term) return

        let cancel_search = false

        search_async_api({
            search_term,
            search_requester_id: props.search_requester_id,
            search_start_time,
        })
        .then(({ error, new_results }) => {
            if (error)
            {
                console.error("Error searching for data components:", error)
                set_error("An error occurred while searching.  Please try again.")
                return
            }
            if (cancel_search) return
            set_results(current_results =>
            {
                // Return which ever results are newer based on search_id
                return current_results && current_results.search_start_time > new_results.search_start_time
                    ? current_results
                    : new_results
            })
        })

        return () => cancel_search = true
    }, [search_term, props.search_requester_id])


    return <div>
        {search_term && (search_term !== results?.search_term
            ? <SearchingFor search_term={search_term} />
            : `Search results for "${results.search_term}"`)
        }

        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        {results?.search_term &&
            (results.result_rows.length > 0 ? (
                <table>
                    {results.result_rows.map((row, index) =>
                        <tr
                            key={index}
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                            {
                                props.on_chosen_search_result({
                                    search_requester_id: results.search_requester_id,
                                    data_component_id: row.data_component_id,
                                })
                            }}
                        >
                            <td>{convert_tiptap_text_to_plain_text(row.title)}</td>
                            <td style={{ color: "#ccc", fontSize: 13, paddingTop: 4.5 }}>
                                id {row.data_component_id}
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
interface SearchResultObj
{
    data_component_id: number
    title: string
    description: string
}
interface SearchResults extends SearchResultsRequest
{
    search_start_time: number
    result_rows: SearchResultObj[]
}
type SearchResultsResponse =
{
    error: null
    new_results: SearchResults
} | {
    error: Error
    new_results: null
}
function search_async_api (request: SearchResultsRequest & { search_start_time: number }): Promise<SearchResultsResponse>
{
    const { search_term, search_requester_id, search_start_time } = request

    return search_data_components(get_supabase, search_term, { page: 0, size: 20 })
    .then(({ data, error }) => {
        if (error) return { error, new_results: null }

        const result_rows = data.map(dc =>
        {
            const row: SearchResultObj = {
                data_component_id: dc.id.id,
                title: dc.title,
                description: dc.description,
            }
            return row
        })

        return {
            error: null,
            new_results: {
                search_start_time,
                search_term,
                search_requester_id,
                result_rows,
            },
        }
    })
}
