import { DataComponent } from "core/data/interface"


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
}
