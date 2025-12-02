import Highlight from "@tiptap/extension-highlight"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import Typography from "@tiptap/extension-typography"
import Underline from "@tiptap/extension-underline"
import StarterKit from "@tiptap/starter-kit"

import { CustomReferences } from "./CustomReferences"
import { SingleLineExtension } from "./extension_enforce_single_line"


export function get_tiptap_extensions(single_line: boolean, experimental_code_editor_features: boolean)
{
    return [
        // For single line mode, keep paragraph but disable block elements
        StarterKit.configure({
            bold: experimental_code_editor_features ? false : undefined,
            blockquote: (single_line || experimental_code_editor_features) ? false : undefined,
            bulletList: (single_line || experimental_code_editor_features) ? false : undefined,
            code: experimental_code_editor_features ? false : undefined,
            codeBlock: (single_line || experimental_code_editor_features) ? false : undefined,
            heading: (single_line || experimental_code_editor_features) ? false : undefined,
            horizontalRule: (single_line || experimental_code_editor_features) ? false : undefined,
            italic: experimental_code_editor_features ? false : undefined,
            listItem: (single_line || experimental_code_editor_features) ? false : undefined,
            orderedList: (single_line || experimental_code_editor_features) ? false : undefined,
            // For single line mode, keep paragraph but disable block elements
            paragraph: undefined,
            strike: experimental_code_editor_features ? false : undefined,
        }),
        // Add single line extension only when in single line mode
        ...(single_line ? [SingleLineExtension] : []),
        Highlight,
        ...(experimental_code_editor_features ? [Typography.configure({})] : []),
        Underline,
        CustomReferences,
        Subscript,
        Superscript,
        Image,
        Link.configure({
            openOnClick: false,
            HTMLAttributes: {
                class: "editor-link",
            },
        }),
    ]
}
