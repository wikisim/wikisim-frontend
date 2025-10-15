import { useRef, useState } from "preact/hooks"

import { tiptap_mention_chip } from "core/test/fixtures"

import { deindent } from "../../lib/core/src/utils/deindent"
import EditOrSaveButton from "../buttons/EditOrSaveButton"
import { CodeEditor } from "./CodeEditor"
import { TextEditorV2 } from "./TextEditorV2"


export const TextEditorDemos = () =>
{
    const [editing, set_editing] = useState(true)

    return <div>
        <EditOrSaveButton editing={editing} set_editing={set_editing} />
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
        <p>
            This ${tiptap_mention_chip("123", "a")}
            That ${tiptap_mention_chip("123", "span")}
        </p>
    `)
    const [input_value, set_input_value] = useState(deindent(`
    function add(a, b) {
        // type "@" here to see a component
        // mention and type d1234v5 overwritten
        return a + b;
    }

    return add(param1, 2)  // change param1 to a_param to see error goes away
    `))
    // a = b + 1
    // `))
    const intial_input_value = useRef(input_value).current

    return <>
        <h3>Single Line Editor</h3>
        {title}
        <br />
        <br />
        <TextEditorV2
            editable={props.editing}
            initial_content={title}
            single_line={true}
            auto_focus={true}
            label="Title"
            on_update={(html, _json) => {
                set_title(html)
            }}
        />

        <h3 style={{ marginTop: "30px" }}>Multi Line Rich Editor</h3>
        {description}
        <br />
        <br />
        <TextEditorV2
            editable={props.editing}
            initial_content={description}
            single_line={false}
            auto_focus={false}
            label="Description"
            on_update={(html, _json) => {
                set_description(html)
            }}
        />

        <h3 style={{ marginTop: "30px" }}>Code Rich Editor</h3>
        {input_value}
        <br />
        <br />
        <CodeEditor
            editable={props.editing}
            initial_content={intial_input_value}
            // single_line={false}
            // auto_focus={false}
            label="Function Value"
            on_update={(html, _json) => {
                set_input_value(html)
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
