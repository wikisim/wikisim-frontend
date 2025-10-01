import Mention from "@tiptap/extension-mention"

import { IdAndMaybeVersion, IdOnly, parse_id } from "core/data/id"

import pub_sub from "../pub_sub"
import { ROUTES } from "../routes"
import "./CustomReferences.css"



// Custom mention extension with chip functionality
const CustomMention = Mention.extend({
    name: "customMention",

    parseHTML()
    {
        return [
            {
                tag: "a.mention-chip",
            },
            {
                tag: "span.mention-chip",
            }
        ]
    },

    addAttributes()
    {
        return {
            id: {
                default: null,
                // This is used to parse out the ID from the HTML element and
                // set the `node.attrs.id` use in the addNodeView function.
                parseHTML: element => element.getAttribute("data-id"),
                // This will be set in the `HTMLAttributes` passed to the
                // renderHTML function
                renderHTML: attributes => ({ "data-id": attributes.id as string }),
            },
            label: {
                default: null,
                // This is used to parse out the ID from the HTML element and
                // set the `node.attrs.id` use in the addNodeView function.
                // Older span based mentions may have had an @ symbol prepended
                // so we remove it here.
                parseHTML: el => el.textContent?.replace(/^@/, "") || "",
                // Don't emit data-label; label will be rendered as inner text
                renderHTML: () => ({}),
            },
            // Override the default mention extension to NOT include mention suggestion char
        }
    },


    addNodeView()
    {
        return ({ node }) =>
        {
            const parsed_id = parse_id_safely(node.attrs.id as string)
            if (!parsed_id) return { dom: document.createElement("span") }

            const dom = document.createElement("a")
            dom.className = `mention-chip ${parsed_id instanceof IdOnly ? "IDo" : "IDv"}`
            const dangerous_str = `${node.attrs.label || ""}`
            // Use textContent instead of innerHTML to prevent XSS
            dom.textContent = dangerous_str
            dom.href = ROUTES.DATA_COMPONENT.VIEW_WIKI_COMPONENT(parsed_id)

            // // label_span.textContent = dangerous_str
            // // dom.appendChild(label_span)

            // // const percentage = "+20%"
            // // dom.className += " alternative-value"

            // Custom chip click behaviour
            dom.addEventListener("click", e => {
                e.preventDefault()
                // prevent the anchor tag from working as we do our own routing
                e.stopImmediatePropagation()
                pub_sub.pub("mention_clicked", { data_component_id: node.attrs.id as string })
            })

            return { dom }
        }
    },


    renderHTML({ HTMLAttributes, node })
    {
        if (!HTMLAttributes["data-id"]) console.warn("CustomMention renderHTML missing data-id attribute", HTMLAttributes)
        const label = (node.attrs.label as string || "")

        return [
            "a",
            { ...HTMLAttributes, class: "mention-chip" },
            label
        ]
    },


    addKeyboardShortcuts()
    {
        return {
            Backspace: ({ editor }) =>
            {
                const { selection, doc } = editor.state

                // Check if we are at the position right after a mention node
                if (selection.empty)
                {
                    const $pos = doc.resolve(selection.from)
                    const before = $pos.nodeBefore

                    if (before && before.type.name === "customMention")
                    {
                        // Delete only the mention node
                        const mentionStart = selection.from - before.nodeSize
                        return editor.commands.deleteRange({ from: mentionStart, to: selection.from })
                    }
                }

                return false
            },
            Delete: ({ editor }) =>
            {
                const { selection, doc } = editor.state

                // Check if we are at the position right before a mention node
                if (selection.empty)
                {
                    const $pos = doc.resolve(selection.from)
                    const after = $pos.nodeAfter

                    if (after && after.type.name === "customMention")
                    {
                        // Delete only the mention node
                        const mentionEnd = selection.from + after.nodeSize
                        return editor.commands.deleteRange({ from: selection.from, to: mentionEnd })
                    }
                }

                return false
            }
        }
    },
})



export const CustomReferences = CustomMention.configure({
    HTMLAttributes: {
        class: "mention-chip",
    },
})


function parse_id_safely(id_str: string): IdAndMaybeVersion | undefined
{
    try
    {
        return parse_id(id_str)
    }
    catch (_)
    {
        return undefined
    }
}
