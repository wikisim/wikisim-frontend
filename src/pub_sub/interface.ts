import { DataComponent } from "core/data/interface"
import { VNode } from "preact"
import { ScreenCharacteristics } from "../utils/screen"


export interface PublishableEvents
{
    search_for_reference: {
        // Identifier of which DOM component is requesting the search
        search_requester_id: string
        search_term?: string
    }
    search_for_reference_completed: {
        // Identifier of which DOM component is requesting the search
        search_requester_id: string
        data_component: DataComponent
    }
    key_down: KeyDownUp
    key_up: KeyDownUp
    mention_clicked: {
        data_component_id: string
    }
    open_save_modal_request_from_ValueEditorForInteractable: true
    log_debug: {
        label: string
        value: unknown
    }

    set_page_footer: {
        jsx: VNode<unknown> | null
        request_id: number
    }

    screen_size_changed: ScreenCharacteristics
}

interface KeyDownUp
{
    key: string
    code: string
    // Whether the meta key (Command on Mac, Windows key on Windows) was
    // depressed when the key was pressed.
    metaKey: boolean
    ctrlKey: boolean
    shiftKey: boolean
    altKey: boolean
    timestamp: number
    event: KeyboardEvent
}
