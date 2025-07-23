import { Modal } from "@mantine/core"
import { useEffect, useMemo, useState } from "preact/hooks"
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

    useEffect(() => {
        const unsubscribe = pub_sub.sub("search_for_reference_completed", () => {
            set_search_window_is_open(false)
            set_search_requester_id("")
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
            />
        </div>}

    </Modal>
}


function SearchResults(props: { search_term: string, search_requester_id: string })
{
    const search_term = props.search_term.trim()
    const { search_requester_id } = props

    const [results, set_results] = useState<SearchResultsResponse | undefined>(undefined)


    useEffect(() => {
        const search_start_time = Date.now() // Unique ID for this search

        set_results(undefined)

        let cancel_search = false

        mock_search_async_api({search_term, search_requester_id, search_start_time}).then(new_results => {
            if (cancel_search) return
            set_results(current_results => {
                // Return which ever results are newer based on search_id
                return current_results && current_results.search_start_time > new_results.search_start_time
                    ? current_results
                    : new_results
            })
        })

        return () => cancel_search = true
    }, [search_term])


    return <div>
        {search_term && (search_term !== results?.search_term
            ? <SearchingFor search_term={search_term} />
            : `Search results for "${results.search_term}"`)
        }

        {results?.search_term &&
            (results.result_rows.length > 0 ? (
                <table>
                    {results.result_rows.map((row, index) => (
                        <tr
                            key={index}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                console.debug("publishing search_for_reference_completed", {
                                    search_requester_id,
                                    data_component_id: row.data_component_id,
                                })
                                pub_sub.pub("search_for_reference_completed", {
                                    search_requester_id,
                                    data_component_id: row.data_component_id,
                                })
                            }}
                        >
                            <td>{row.title}</td>
                        </tr>
                    ))}
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
}
interface SearchResultsResponse extends SearchResultsRequest
{
    search_start_time: number
    result_rows: SearchResultObj[]
}
function mock_search_async_api (request: SearchResultsRequest & { search_start_time: number }): Promise<SearchResultsResponse>
{
    const { search_term, search_start_time, search_requester_id } = request

    return new Promise(resolve => {
        setTimeout(() => {
            // Mock search results
            const mock_results: SearchResultObj[] = [
                {title: `Result for "${search_term}" 1`, data_component_id: 1},
                {title: `Result for "${search_term}" 2`, data_component_id: 2},
                {title: `Result for "${search_term}" 3`, data_component_id: 3},
            ]
            resolve({
                search_term,
                search_start_time,
                search_requester_id,
                result_rows: mock_results
            })
        }, search_term.length < 2 ? 5000 : 1000) // Simulate network delay
    })
}
