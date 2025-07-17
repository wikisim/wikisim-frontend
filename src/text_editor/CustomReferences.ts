import Mention from "@tiptap/extension-mention"

import "./CustomReferences.css"



// Custom mention extension with chip functionality
const CustomMention = Mention.extend({
    name: "customMention",

    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: element => element.getAttribute("data-id"),
                renderHTML: attributes => {
                    if (!attributes.id) {
                        return {}
                    }
                    return {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        "data-id": attributes.id,
                    }
                },
            },
            label: {
                default: null,
                parseHTML: element => element.getAttribute("data-label"),
                renderHTML: attributes => {
                    if (!attributes.label) {
                        return {}
                    }
                    return {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        "data-label": attributes.label,
                    }
                },
            },
            // Override the default mention extension to NOT include mention suggestion char
        }
    },

    addKeyboardShortcuts() {
        return {
            Backspace: ({ editor }) => {
                const { selection, doc } = editor.state

                // Check if we are at the position right after a mention node
                if (selection.empty) {
                    const $pos = doc.resolve(selection.from)
                    const before = $pos.nodeBefore

                    if (before && before.type.name === "customMention") {
                        // Delete only the mention node
                        const mentionStart = selection.from - before.nodeSize
                        return editor.commands.deleteRange({ from: mentionStart, to: selection.from })
                    }
                }

                return false
            },
            Delete: ({ editor }) => {
                const { selection, doc } = editor.state

                // Check if we are at the position right before a mention node
                if (selection.empty) {
                    const $pos = doc.resolve(selection.from)
                    const after = $pos.nodeAfter

                    if (after && after.type.name === "customMention") {
                        // Delete only the mention node
                        const mentionEnd = selection.from + after.nodeSize
                        return editor.commands.deleteRange({ from: selection.from, to: mentionEnd })
                    }
                }

                return false
            }
        }
    },

    addNodeView() {
        return ({ node }) => {
            const dom = document.createElement("span")
            dom.className = "mention-chip"
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            dom.setAttribute("data-id", node.attrs.id)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            dom.setAttribute("data-label", node.attrs.label)

            const percentage = "+20%"
            dom.innerHTML = `<span style="color: #1976d2;">${node.attrs.label}</span> (${percentage})`
            dom.className += " alternative-value"

            // Make chip clickable and editable
            dom.addEventListener("click", (e) => {
                e.preventDefault()
                // You could open an edit modal here
                console.log("Clicked mention:", node.attrs)
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
