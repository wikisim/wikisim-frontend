import Mention from "@tiptap/extension-mention"

import "./TextEditorV2.css"



// Custom mention extension with chip functionality
const CustomMention = Mention.extend({
    name: "customMention",

    mentionSuggestionChar: "", // Disable the default "@" character

    addNodeView() {
        return ({ node, getPos, editor }) => {
            const dom = document.createElement("span")
            dom.className = "mention-chip"
            dom.setAttribute("data-id", node.attrs.id)
            dom.setAttribute("data-label", node.attrs.label)
            dom.textContent = node.attrs.label

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


// // Mock data for mentions
// const mockMentions = [
//     { id: "1", label: "John Doe", description: "Software Engineer" },
//     { id: "2", label: "Jane Smith", description: "Product Manager" },
//     { id: "3", label: "Mike Johnson", description: "Designer" },
//     { id: "4", label: "Sarah Wilson", description: "Data Scientist" },
// ]
// const suggestion = {
//     items: ({ query }: { query: string }) => {
//         return mockMentions.filter(item =>
//             item.label.toLowerCase().includes(query.toLowerCase())
//         ).slice(0, 5)
//     },

//     render: () => {
//         let search_modal_component: ReactRenderer

//         return {
//             onStart: (props: any) => {
//                 search_modal_component = new ReactRenderer(MentionList, {
//                     props,
//                     editor: props.editor,
//                 })
//             },

//             onUpdate(props: any) {
//                 search_modal_component.updateProps(props)
//             },

//             onKeyDown(props: any) {
//                 if (props.event.key === "Escape")
//                 {
//                     return true
//                 }
//                 return search_modal_component.ref?.onKeyDown?.(props)
//             },

//             onExit() {
//                 search_modal_component.destroy()
//             },
//         }
//     },
// }


// // Mention suggestion component
// function MentionList({ items, command, range }: any) {
//     const [selectedIndex, setSelectedIndex] = useState(0)

//     const selectItem = (index: number) => {
//         const item = items[index]
//         if (item) {
//             command({
//                 id: item.id,
//                 label: item.label,
//                 data: item // Store additional data for the chip
//             })
//         }
//     }

//     useEffect(() => {
//         setSelectedIndex(0)
//     }, [items])

//     return (
//         <div className="mention-suggestions">
//             {items.map((item: any, index: number) => (
//                 <div
//                     key={item.id}
//                     className={`mention-item ${index === selectedIndex ? "selected" : ""}`}
//                     onClick={() => selectItem(index)}
//                 >
//                     <strong>{item.label}</strong>
//                     <div className="mention-description">{item.description}</div>
//                 </div>
//             ))}
//         </div>
//     )
// }


export const CustomReferencesAndSearch = CustomMention.configure({
    HTMLAttributes: {
        class: "mention-chip",
    },
    // suggestion,
})
