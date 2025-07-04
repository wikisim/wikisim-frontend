import { Extension } from "@tiptap/core"

// Single line extension to enforce single line behavior
export const SingleLineExtension = Extension.create({
    name: "singleLine",

    addKeyboardShortcuts() {
        return {
            Enter: () => {
                // Prevent Enter key from creating new lines
                return true
            },
            "Shift-Enter": () => {
                // Also prevent Shift+Enter
                return true
            },
        }
    },
})
