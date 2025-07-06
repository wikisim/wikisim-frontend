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
            // lineHeights: {
            //     md: "0",
            // },
            colors: {
                // Define custom colors if needed
            },
            components: {
                Tooltip: {
                    styles: {
                        tooltip: {
                            // Light blue
                            backgroundColor: "#e7f3ff",
                            color: "#1c7ed6",
                            // Light grey
                            // backgroundColor: "#f8f9fa",
                            // color: "#495057",
                            // Warm grey
                            // backgroundColor: "#f1f3f4",
                            // color: "#5f6368",
                            // backgroundColor: "#ffffff",
                            // color: "#374151",

                            border: "1px solid #dee2e6",
                            // fontSize: "12px",
                            // fontWeight: 500,
                        },
                        arrow: {
                            borderColor: "#dee2e6",
                        },
                    },
                },
            },
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
