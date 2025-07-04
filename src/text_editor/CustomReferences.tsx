import Mention from "@tiptap/extension-mention"

import "./CustomReferences.css"



// Custom mention extension with chip functionality
const CustomMention = Mention.extend({
    name: "customMention",

    addNodeView() {
        return ({ node, getPos, editor }) => {
            const dom = document.createElement("span")
            dom.className = "mention-chip"
            dom.setAttribute("data-id", node.attrs.id)
            dom.setAttribute("data-label", node.attrs.label)
            dom.setAttribute("data-mention-suggestion-char", "") // Disable the default "@" character

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
