import { defaultVariantColorsResolver, MantineProvider, VariantColorsResolverInput } from "@mantine/core"
import "@mantine/core/styles.css"
import { Notifications } from "@mantine/notifications"
import "@mantine/notifications/styles.css"
import { render } from "preact"
import { ErrorBoundary, LocationProvider, Route, Router } from "preact-iso"

import { Evaluator } from "core/evaluator/browser_sandboxed_javascript"

import "./main.css"
import "./monkey_patch"
import { DataComponentPage } from "./pages/DataComponentPage"
import { DataComponentPageEdit } from "./pages/DataComponentPageEdit"
import { DataComponentPageNew } from "./pages/DataComponentPageNew"
import { DataComponentPageVersionHistory } from "./pages/DataComponentPageVersionHistory"
import { DataComponentsSearchPage } from "./pages/DataComponentsSearchPage"
import { HomePage } from "./pages/HomePage"
import { UserPage } from "./pages/UserPage"
import { WelcomeModal } from "./pages/WelcomeModal"
import "./pub_sub/publish_key_down_events"
import "./remove_supabase_hash"
import { ROUTES } from "./routes"
import { MentionsClickHandler } from "./text_editor/MentionsClickHandler"
import Header from "./ui_components/Header"
import { SearchModal } from "./ui_components/search/SearchModal"


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
                Modal: {
                    defaultProps: {
                        yOffset: 100, // Moves modal 100px from the top
                    },
                },
                Tooltip: {
                    styles: {
                        tooltip: {
                            // Light blue
                            backgroundColor: "#e7f3ff",
                            color: "var(--colour-primary-blue)",
                            // Light grey
                            // backgroundColor: "#f8f9fa",
                            // color: "#495057",
                            // Warm grey
                            // backgroundColor: "#f1f3f4",
                            // color: "#5f6368",
                            // backgroundColor: "#ffffff",
                            // color: "#374151",

                            border: "1px solid var(--colour-border)",
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
        <Evaluator />

        <Notifications
            style={{
                zIndex: "var(--z-index-notifications)",
            }}
        />

        <WelcomeModal />
        <SearchModal />

        <LocationProvider>
            <Header />
            <div className="main-app-container">
                <ErrorBoundary>
                    <Router>
                        <Route path="/" component={HomePage} />
                        <Route path={ROUTES.USER.VIEW()} component={UserPage} />

                        <Route path={ROUTES.DATA_COMPONENT.NEW()} component={DataComponentPageNew} />
                        <Route path={ROUTES.DATA_COMPONENT.SEARCH()} component={DataComponentsSearchPage} />
                        <Route path={ROUTES.DATA_COMPONENT.EDIT()} component={DataComponentPageEdit} />
                        <Route path={ROUTES.DATA_COMPONENT.VIEW_WIKI_COMPONENT()} component={DataComponentPage} />
                        <Route path={ROUTES.DATA_COMPONENT.VIEW_USER_COMPONENT()} component={DataComponentPage} />
                        <Route path={ROUTES.DATA_COMPONENT.VIEW_VERSION_HISTORY()} component={DataComponentPageVersionHistory} />
                        {/* <Route path="/demo/text_editor_demos" component={TextEditorDemos} /> */}
                        <Route default component={NotFound} />
                    </Router>
                </ErrorBoundary>
            </div>
            <MentionsClickHandler />
        </LocationProvider>

    </MantineProvider>
}

render(<App />, document.getElementById("app")!)



function variantColorResolver (input: VariantColorsResolverInput)
{
    const default_resolved_colours = defaultVariantColorsResolver(input)

    if (input.variant === "danger")
    {
        return {
            background: "var(--mantine-color-red-9)",
            hover: "var(--mantine-color-red-8)",
            color: "var(--mantine-color-white)",
            border: "none",
        }
    }

    if (input.variant === "primary-user")
    {
        return {
            background: "var(--mantine-color-green-filled)",
            hover: "var(--mantine-color-green-7)",
            color: "var(--mantine-color-white)",
            border: "none",
        }
    }

    return default_resolved_colours
}


interface NotFoundProps
{
	path: string
	query: Record<string, string>
	params: Record<string, string>
}
function NotFound(_props: NotFoundProps)
{
    return <div>
        <h2>404 Not Found</h2>
        <p>The page you are looking for does not exist.</p>
        <p>Please check the URL or return to the <a href="/">home page</a>.</p>
    </div>
}
