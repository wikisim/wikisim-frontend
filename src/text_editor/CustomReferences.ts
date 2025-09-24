import Mention from "@tiptap/extension-mention"

import { IdAndMaybeVersion, IdOnly, parse_id } from "../../lib/core/src/data/id"
import pub_sub from "../pub_sub"
import { ROUTES } from "../routes"
import "./CustomReferences.css"



// Custom mention extension with chip functionality
const CustomMention = Mention.extend({
    name: "customMention",

    addAttributes()
    {
        return {
            id: {
                default: null,
                parseHTML: element => element.getAttribute("data-id"),
                renderHTML: attributes =>
                {
                    if (!attributes.id) return {}
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    return { "data-id": attributes.id }
                },
            },
            label: {
                default: null,
                parseHTML: element => element.getAttribute("data-label"),
                renderHTML: attributes =>
                {
                    if (!attributes.label) return {}
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    return { "data-label": attributes.label }
                },
            },
            // Override the default mention extension to NOT include mention suggestion char
        }
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

    addNodeView()
    {
        return ({ node }) =>
        {
            let parsed_id: IdAndMaybeVersion
            try
            {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                parsed_id = parse_id(node.attrs.id)
            }
            catch (_)
            {
                const empty_dom = document.createElement("span")
                return { dom: empty_dom }
            }

            const dom = document.createElement("a")

            dom.className = `mention-chip ${parsed_id instanceof IdOnly ? "IDo" : "IDv"}`
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            dom.setAttribute("data-id", node.attrs.id)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            dom.setAttribute("data-label", node.attrs.label)

            const dangerous_str = `${node.attrs.label || node.attrs.id || ""}`
            const label_span = document.createElement("span")
            label_span.className = "mention-label"

            // Use textContent instead of innerHTML to prevent XSS
            label_span.textContent = dangerous_str
            dom.appendChild(label_span)

            // const percentage = "+20%"
            // dom.className += " alternative-value"

            dom.href = ROUTES.DATA_COMPONENT.VIEW_WIKI_COMPONENT(parsed_id)
            // Make chip clickable and editable
            dom.addEventListener("click", (e) =>
            {
                e.preventDefault()
                // prevent the anchor tag from working as we do our own routing
                e.stopImmediatePropagation()

                // When editing, we will want to add some different functionality
                // here that allows the user to customise / edit the reference.
                // For now, we just publish an mention_clicked event and that
                // will redirect to the corresponding data component view.
                pub_sub.pub("mention_clicked", { data_component_id: node.attrs.id as string })
            })

            return { dom }
        }
    }
})



export const CustomReferences = CustomMention.configure({
    HTMLAttributes: {
        class: "mention-chip",
    },
})
