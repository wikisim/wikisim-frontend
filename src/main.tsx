import { MantineProvider } from "@mantine/core"
import "@mantine/core/styles.css"
import { render } from "preact"

import "./monkey_patch"
import { TextEditorDemos } from "./text_editor/Demos"
import { SearchModal } from "./text_editor/SearchModal"

function App() {

    return <MantineProvider
        theme={{
            fontFamily: `"Exo 2", sans-serif`,
            colors: {
                // Define custom colors if needed
            }
        }}
    >
        <SearchModal />

        <div>
            <h1>WikiSim</h1>
            <p>An open source platform for back of the envelope calculations, data, and models of complex problems.</p>
            <p>WikiSim is a work in progress. Please check back later.</p>
        </div>

        <TextEditorDemos />

    </MantineProvider>
}

render(<App />, document.getElementById("app")!)
