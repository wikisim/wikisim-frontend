import Mention from "@tiptap/extension-mention"

import "./CustomReferences.css"



// Custom mention extension with chip functionality
const CustomMention = Mention.extend({
    name: "customMention",

    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: element => element.getAttribute('data-id'),
                renderHTML: attributes => {
                    if (!attributes.id) {
                        return {}
                    }
                    return {
                        'data-id': attributes.id,
                    }
                },
            },
            label: {
                default: null,
                parseHTML: element => element.getAttribute('data-label'),
                renderHTML: attributes => {
                    if (!attributes.label) {
                        return {}
                    }
                    return {
                        'data-label': attributes.label,
                    }
                },
            },
            // Override the default mention extension to NOT include mention suggestion char
        }
    },

    addNodeView() {
        return ({ node, getPos, editor }) => {
            const dom = document.createElement("span")
            dom.className = "mention-chip"
            dom.setAttribute("data-id", node.attrs.id)
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

            return {
                dom,
                update: (updatedNode) => {
                    debugger
                    return true
                }
            }
        }
    }
})



export const CustomReferences = CustomMention.configure({
    HTMLAttributes: {
        class: "mention-chip",
    },
})
