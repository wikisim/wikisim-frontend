import { useRef, useState } from "preact/hooks"

import { tiptap_mention_chip } from "core/test/fixtures"

import { Button } from "@mantine/core"
import { FunctionArgument } from "../../lib/core/src/data/interface"
import { deindent } from "../../lib/core/src/utils/deindent"
import EditOrSaveButton from "../buttons/EditOrSaveButton"
import { CodeEditor } from "./CodeEditor"
import { TextEditorV1 } from "./TextEditorV1"
import { TextEditorV2 } from "./TextEditorV2"


export const TextEditorDemos = () =>
{
    const [editing, set_editing] = useState(true)
    const [invalid_value, set_invalid_value] = useState<false | string>(false)

    return <div>
        {editing ? "Editing" : "Viewing"}. Toggle to {editing ? "Viewing" : "Editing"} ===&gt;
        <EditOrSaveButton editing={editing} set_editing={set_editing} />
        <br />
        Mark value as invalid ===&gt;
        <button onClick={() => set_invalid_value(v => v ? false : "This value is invalid")}>
            {invalid_value ? "Unset Invalid Value" : "Set Invalid Value"}
        </button>

        <h2>Code Editor Demo</h2>
        <CodeEditorDemo editing={editing} invalid_value={invalid_value} />

        {/* <h2>Text Editor V1 Demo</h2>
        <TextEditorV1Demo editing={editing} invalid_value={invalid_value} />
        <h2>Text Editor V2 Demo</h2>
        <TextEditorV2Demo editing={editing} invalid_value={invalid_value} /> */}

    </div>
}



function TextEditorV1Demo (props: { editing: boolean, invalid_value: false | string })
{
    const [title, set_title] = useState("Some title")
    const [description, set_description] = useState("## Some description\n\nThis is a multiline description with some markdown formatting that's not supported yet.\n\n- Item 1\n- Item 2\n- Item 3")

    return <>

        {`${new Date().toLocaleTimeString()} ${new Date().getMilliseconds()}`}

        <TextEditorV1
            editable={props.editing}
            label="Title"
            initial_content={title}
            single_line={true}
            on_blur={e => set_title(e.currentTarget.value)}
            invalid_value={props.invalid_value}
        />
        <TextEditorV1
            editable={props.editing}
            label="Description"
            initial_content={description}
            single_line={false}
            on_blur={e => set_description(e.currentTarget.value)}
            invalid_value={props.invalid_value}
        />
    </>
}



const TextEditorV2Demo = (props: { editing: boolean, invalid_value: false | string }) =>
{
    const [title, set_title] = useState("Some title")
    const [description, set_description] = useState(`
        <p>
            This ${tiptap_mention_chip("123", "a")}
            That ${tiptap_mention_chip("123", "span")}
        </p>
    `)

    return <>
        <h3>TextEditorV1 Single Line Editor</h3>
        {title}
        <br />
        <br />
        <TextEditorV1
            editable={props.editing}
            initial_content={title}
            single_line={true}
            label="Title"
            on_change={e => {
                // set_title(e.currentTarget.value)
            }}
            invalid_value={props.invalid_value}
        />

        <h3>TipTap Single Line Editor</h3>
        {title}
        <br />
        <br />
        <TextEditorV2
            editable={props.editing}
            initial_content={title}
            single_line={true}
            auto_focus={false}
            label="Title"
            on_update={(html, _json) => {
                set_title(html)
            }}
            invalid_value={props.invalid_value}
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



function CodeEditorDemo (props: { editing: boolean, invalid_value: false | string })
{
    const [input_value, set_input_value] = useState(deindent(`a = b + 1`))
    // function add(a, b) {
    //     // type "@" here to see a component
    //     // mention and type d1234v5 overwritten
    //     return a + b;
    // }

    // return add(param1, 2)  // change param1 to a_param to see error goes away
    // `))
    const intial_input_value = useRef(input_value).current
    const [function_arguments, set_function_arguments] = useState<FunctionArgument[] | undefined>([{ name: "a_param", id: 0 }])

    const toggle_function_arguments = () =>
    {
        set_function_arguments(fa => fa?.length ? undefined : [{ name: "a_param", id: 0 }])
    }

    return <>
        <h3 style={{ marginTop: "30px" }}>Code Rich Editor</h3>
        <Button onClick={toggle_function_arguments}>Toggle function arguments</Button>
        Function Arguments: {(function_arguments || []).map(fa => fa.name).join(", ") || "None"}
        <br/>
        <br/>
        <CodeEditor
            editable={false}
            initial_content={input_value}
            value={input_value}
            function_arguments={function_arguments}
            label="Function Value"
            // invalid_value={props.invalid_value}
        />
        <br />
        <br />
        <CodeEditor
            editable={props.editing}
            initial_content={intial_input_value}
            value={input_value}
            function_arguments={function_arguments}
            // single_line={false}
            // auto_focus={false}
            label="Input Value"
            auto_focus={true}
            on_update={set_input_value}
            // invalid_value={props.invalid_value}
        />
    </>
}
