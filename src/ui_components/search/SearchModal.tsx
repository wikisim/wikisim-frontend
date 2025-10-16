import { Modal } from "@mantine/core"
import { useEffect, useMemo, useState } from "preact/hooks"


import pub_sub from "../../pub_sub"
import { local_storage } from "../../state/local_storage"
import { app_store } from "../../state/store"
import { TextEditorV1 } from "../../text_editor/TextEditorV1"
import { debounce } from "../../utils/debounce"
import { is_mobile_device } from "../../utils/is_mobile_device"
import { ToggleTwo } from "../ToggleTwo"
import { SearchResults } from "./SearchResults"


export function SearchModal()
{
    const state = app_store()

    const [search_window_is_open, set_search_window_is_open] = useState(false)
    const [search_term, set_search_term] = useState("")
    const [search_requester_id, set_search_requester_id] = useState("")
    const trimmed_search_term = search_term.trim()

    const user_signed_in = state.user_auth_session.session?.user
    const [filter_by_user_id, set_filter_by_user_id] = useState(local_storage.get_search_filter_by_user_id())
    local_storage.set_search_filter_by_user_id(filter_by_user_id)

    useEffect(() => {
        const unsubscribe = pub_sub.sub("search_for_reference", data =>
        {
            console.debug("search_for_reference event received", data)
            set_search_window_is_open(true)
            set_search_requester_id(data.search_requester_id)
            set_search_term(data.search_term || "")
        })
        // Cleanup function to unsubscribe when the component unmounts
        return unsubscribe
    }, [])


    const debounce_set_search_term = useMemo(() => debounce(set_search_term, 300), [])


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
                initial_content={search_term}
                on_change={e => debounce_set_search_term(e.currentTarget.value)}
                single_line={true}
                // This is a hack to ensure the search modal is shown on the
                // screen otherwise it is mostly hidden off the top of the screen
                start_focused={on_mobile ? false : "focused_and_text_selected"}
                trigger_search_on_at_symbol={false}
            />

            <div class="vertical-gap" />

            {/* Should we use <ToggleFilterByUser /> component instead? */}
            {user_signed_in && <ToggleTwo
                active={!!filter_by_user_id}
                label={active => active ? "Only your pages" : "All pages (Wiki, yours and others)"}
                set_active={active => set_filter_by_user_id(active ? user_signed_in.id : "")}
            />}

            <div class="vertical-gap" />

            <SearchResults
                search_term={trimmed_search_term}
                filter_by_owner_id={filter_by_user_id || undefined}
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
