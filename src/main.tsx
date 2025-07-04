import { MantineProvider } from "@mantine/core"
import "@mantine/core/styles.css"
import { render } from "preact"
import { useState } from "preact/hooks"

import { TipTapEditor } from "./text_editor/TipTapDemo"

import "./monkey_patch"
import { TextEditorV1 } from "./text_editor/TextEditorV1"

function App() {
    const [title, set_title] = useState("")
    const [description, set_description] = useState("")

    return <MantineProvider
        theme={{
            fontFamily: `"Exo 2", sans-serif`,
            colors: {
                // Define custom colors if needed
            }
        }}
    >
        <div>
            <h1>WikiSim</h1>
            <p>An open source platform for back of the envelope calculations, data, and models of complex problems.</p>
            <p>WikiSim is a work in progress. Please check back later.</p>
        </div>

        <div style={{ padding: '20px' }}>
            <TextEditorV1 />
        </div>

        <div style={{ padding: '20px' }}>
            <h3>Single Line Editor with @ mentions:</h3>
            <TipTapEditor
                initialContent={title}
                singleLine={true}
                autoFocus={true}
                selectAllOnFocus={false}
                label="Type @ to trigger mentions..."
                onUpdate={(json, html) => {
                    console.log('Single line content:', { json, html })
                    set_title(html)
                }}
            />

            <h3 style={{ marginTop: '30px' }}>Multi Line Rich Editor:</h3>
            <TipTapEditor
                initialContent={description}
                singleLine={false}
                autoFocus={false}
                selectAllOnFocus={false}
                label="Try markdown shortcuts like ## for headings, * for bullets, @ for mentions..."
                onUpdate={(json, html) => {
                    console.log('Multi line content:', { json, html })
                    set_description(html)
                }}
            />

            <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                <h4>Features to try:</h4>
                <ul style={{ fontSize: '14px' }}>
                    <li>Type <code>@</code> to trigger mention search</li>
                    <li>Use <code>Ctrl+B</code> for bold, <code>Ctrl+I</code> for italic</li>
                    <li>Type <code>##</code> for headings, <code>*</code> for bullet points</li>
                    <li>Right-click for context menu</li>
                    <li>Use <code>Ctrl+K</code> to insert links</li>
                    <li>Click "Get JSON" button to see serialized data</li>
                </ul>
            </div>
        </div>

    </MantineProvider>
}

render(<App />, document.getElementById("app")!)
