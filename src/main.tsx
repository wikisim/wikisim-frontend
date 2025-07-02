import { MantineProvider } from "@mantine/core"
import { render } from "preact"

import "./index.css"
import "./monkey_patch"



function App ()
{
    return <MantineProvider>
        <div>
            <h1>WikiSim</h1>
            <p>An open source platform for back of the envelope calculations, data, and models of complex problems.</p>
            <p>WikiSim is a work in progress. Please check back later.</p>
        </div>
    </MantineProvider>
}

render(<App />, document.getElementById("app")!)
