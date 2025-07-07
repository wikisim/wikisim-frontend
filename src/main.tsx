import { defaultVariantColorsResolver, MantineProvider, VariantColorsResolverInput } from "@mantine/core"
import "@mantine/core/styles.css"
import { render } from "preact"

import { ErrorBoundary, LocationProvider, Route, Router, useLocation } from "preact-iso"
import "./main.css"
import "./monkey_patch"
import { get_store } from "./state/store"
import { TextEditorDemos } from "./text_editor/Demos"
import { SearchModal } from "./text_editor/SearchModal"
import Header from "./ui_components/Header"


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
            variantColorResolver,
        }}
    >

        <Header />
        <div className="main-app-container">
            <SearchModal />

            <LocationProvider>
                <ErrorBoundary>
                    <Router>
                        <Route path="/" component={HomePage} />
                        <Route path="/data/:data_component_id" component={DataComponentPage} />
                        <Route path="/demo/state_management" component={StateManagementDemo} />
                        <Route path="/demo/text_editor_demos" component={TextEditorDemos} />
                        <Route default component={NotFound} />
                    </Router>
                </ErrorBoundary>
            </LocationProvider>

        </div>
    </MantineProvider>
}

render(<App />, document.getElementById("app")!)



function variantColorResolver (input: VariantColorsResolverInput)
{
    const default_resolved_colours = defaultVariantColorsResolver(input)

    if (input.variant === "danger") {
        return {
            background: "var(--mantine-color-red-9)",
            hover: "var(--mantine-color-red-8)",
            color: "var(--mantine-color-white)",
            border: "none",
        }
    }

    return default_resolved_colours
}



function HomePage()
{
    const location = useLocation()
    return (
        <div>
            <h1>WikiSim</h1>
            <p>An open source platform for data, back of the envelope calculations, and models of complex problems.</p>
            <p>WikiSim is a work in progress. Please check back later.</p>

            <p>
                See Data component no 1: <a href="/data/1">Data Component 1</a>
            </p>
            <p onClick={() =>
            {
                location.route("/data/2")
            }}>
                See Data component no 2
            </p>
        </div>
    )
}

function DataComponentPage(props: { data_component_id: string, query: Record<string, string> })
{
    const location = useLocation()

    return (
        <div>
            <h2>Data Component: {props.data_component_id} ?a={props.query.a}</h2>
            <p>{JSON.stringify(props)}</p>
            <p>This is a placeholder for the data component with ID: {props.data_component_id}</p>

            <p onClick={() =>
            {
                const new_query = { ...location.query, a: "100" }
                const new_path = location.path + "?" + new URLSearchParams(new_query).toString()
                location.route(new_path)
            }}>Set query a to 100</p>
            <p onClick={() => location.route("/")}>Home page</p>
        </div>
    )
}


function StateManagementDemo()
{
    const { user_auth_session } = get_store()
    const logged_in = user_auth_session.isLoggedIn

    return (
        <div>
            <h2>State Management Demo</h2>
            <p>This is a demo of state management using Zustand.</p>
            <div onClick={() =>
            {
                if (logged_in)
                {
                    user_auth_session.logout()
                }
                else
                {
                    user_auth_session.login({ id: "1", name: "A Person", email: "abc@example.com" })
                }
            }}>
                {logged_in ? "log out" : "log in"}
            </div>
        </div>
    )
}


interface NotFoundProps
{
	path: string;
	query: Record<string, string>;
	params: Record<string, string>;
}
function NotFound(_props: NotFoundProps)
{
    return <div>
        <h2>404 Not Found</h2>
        <p>The page you are looking for does not exist.</p>
        <p>Please check the URL or return to the <a href="/">home page</a>.</p>
    </div>
}
