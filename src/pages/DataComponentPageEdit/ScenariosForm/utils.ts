import { Scenario } from "core/data/interface"
import { browser_convert_tiptap_to_plain } from "core/rich_text/browser_convert_tiptap_to_plain"


export function scenario_is_empty(arg: Scenario): boolean
{
    if (arg.description && browser_convert_tiptap_to_plain(arg.description).trim()) return false

    return Object.values(arg.values_by_temp_id)
        .every(v => (
            v.value.trim() === ""
            && !v.iterate_over
        ))
}
