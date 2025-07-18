import Highlight from "@tiptap/extension-highlight"
import Link from "@tiptap/extension-link"
import Typography from "@tiptap/extension-typography"
import Underline from "@tiptap/extension-underline"
import StarterKit from "@tiptap/starter-kit"

import { CustomReferences } from "./CustomReferences"
import { SingleLineExtension } from "./extension_enforce_single_line"


export function get_tiptap_extensions(single_line: boolean)
{
    return [
        StarterKit.configure({
            // For single line mode, keep paragraph but disable block elements
            heading: single_line ? false : undefined,
            bulletList: single_line ? false : undefined,
            orderedList: single_line ? false : undefined,
            blockquote: single_line ? false : undefined,
            codeBlock: single_line ? false : undefined,
            horizontalRule: single_line ? false : undefined,
        }),
        // Add single line extension only when in single line mode
        ...(single_line ? [SingleLineExtension] : []),
        Highlight,
        Typography,
        Underline,
        CustomReferences,
        Link.configure({
            openOnClick: false,
            HTMLAttributes: {
                class: "editor-link",
            },
        }),
    ]
}
