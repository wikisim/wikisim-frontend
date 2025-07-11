import { useState } from "preact/hooks"

import EditButton from "../buttons/EditButton"
import { TextEditorV2 } from "./TextEditorV2"


export const TextEditorDemos = () =>
{
    const [editing, set_editing] = useState(true)

    return <div>
        <EditButton editing={editing} set_editing={set_editing} />
        {/* <h2>Text Editor V1 Demo</h2>
        <TextEditorV1Demo editing={editing} /> */}
        <h2>Text Editor V2 Demo</h2>
        <TextEditorV2Demo editing={editing} />
    </div>
}


// function TextEditorV1Demo (props: { editing: boolean })
// {
//     const [title, set_title] = useState("Some title")
//     const [description, set_description] = useState("## Some description\n\nThis is a multiline description with some markdown formatting that's not supported yet.\n\n- Item 1\n- Item 2\n- Item 3")

//     return <>

//         {`${new Date().toLocaleTimeString()} ${new Date().getMilliseconds()}`}

//         <TextEditorV1
//             editable={props.editing}
//             label="Title"
//             value={title}
//             single_line={true}
//             on_blur={(e: any) => set_title(e.target.value)}
//         />
//         <TextEditorV1
//             editable={props.editing}
//             label="Description"
//             value={description}
//             single_line={false}
//             on_blur={(e: any) => set_description(e.target.value)}
//         />
//     </>
// }


const TextEditorV2Demo = (props: { editing: boolean }) =>
{
    const [title, set_title] = useState("Some title")
    const [description, set_description] = useState(`
        <h2>Some description</h2>
        <p>This is a multiline description with some markdown triggered formatting saved as html.</p>
        <p>This <span class="mention-chip" data-type="customMention" data-id="2" data-label="Some label">@Some label</span><u>20 million homes</u> can become <u>25 million (+25%) homes</u>.</p>
        <ul><li><p>Item 1</p></li><li><p>Item 2</p></li><li><p>Item 3</p></li></ul>
    `)

    return <>
        <h3>Single Line Editor</h3>
        {title}
        <TextEditorV2
            editable={props.editing}
            initial_content={title}
            single_line={true}
            auto_focus={true}
            label="Title"
            on_update={(_json, html) => {
                set_title(html)
            }}
        />

        <h3 style={{ marginTop: "30px" }}>Multi Line Rich Editor</h3>
        {description}
        <TextEditorV2
            editable={props.editing}
            initial_content={description}
            single_line={false}
            auto_focus={false}
            label="Description"
            on_update={(_json, html) => {
                set_description(html)
            }}
        />

        <div style={{ marginTop: "20px", padding: "10px", background: "#f5f5f5", borderRadius: "4px" }}>
            <h4>Text Editing Features:</h4>
            <ul style={{ fontSize: "14px" }}>
                <li>Type <code>@</code> to search for other components to reference</li>
                <li>Use <code>Ctrl+B</code> for bold, <code>Ctrl+I</code> for italic</li>
                <li>Type <code>##</code> for headings, <code>*</code> for bullet points</li>
                <li>Use <code>Ctrl+K</code> to insert links</li>
            </ul>
        </div>
    </>
}
