import { Editor, Range } from "@tiptap/core"


export function highlight_text_fragment(editor: Editor)
{
    const ranges = get_text_fragment_ranges_from_url()

    if (!ranges.length) return

    editor.commands.setTextSelection({ from: 0, to: 0 })

    editor.commands.unsetHighlight()
    ranges.forEach(range =>
    {
        // Can not get toggleHighlight colour to work yet, suspect it is due to
        // older version of tiptap being used.
        editor.chain()
            .setTextSelection(range)
            .toggleHighlight({ color: "#ffa8a8" })
            .run()
    })

    scroll_to_selection(editor)
}


function get_text_fragment_ranges_from_url(): Range[]
{
    function decode_fragment_range(fragment_range: string): Range | undefined
    {
        const parts = fragment_range.split("-")
        if (parts.length !== 2) return undefined

        const from = parseInt(parts[0] || "")
        const to = parseInt(parts[1] || "")
        if (isNaN(from) || isNaN(to) || from < 0 || to <= from) return undefined
        return { from, to }
    }

    function is_range(value: Range | undefined): value is Range
    {
        return value !== undefined
    }

    // Unfortauntely Text Fragments are removed from the URL when the page loads
    // so we can't support use of #:~:text=... to highlight text.
    // https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments#syntax
    const text_fragment_ranges = new URLSearchParams(window.location.search)
        .getAll("ht")
        .map(decode_fragment_range)
        .filter(is_range)

    return text_fragment_ranges
}

/**
 * Adapted from https://stackoverflow.com/a/74352868/539490
 * Scrolls to the current position/selection of the document. It does the same
 * as scrollIntoView() but without requiring the focus on the editor, thus it
 * can be called while the editor is disabled.
 * @param {Editor} editor
*/
function scroll_to_selection(editor: Editor): void
{
    const { node } = editor.view.domAtPos(editor.state.selection.anchor)
    if (!(node instanceof Element)) return
    node.scrollIntoView({ behavior: "smooth", block: "center" })
}
