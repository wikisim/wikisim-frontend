import { Modal } from "@mantine/core"
import { useEffect, useMemo, useState } from "preact/hooks"


import pub_sub from "../../pub_sub"
import { TextEditorV1 } from "../../text_editor/TextEditorV1"
import { is_mobile_device } from "../../utils/is_mobile_device"
import { SearchResults } from "./SearchResults"


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
        zIndex="var(--z-index-modal-search)"
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
