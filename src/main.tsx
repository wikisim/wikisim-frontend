import { defaultVariantColorsResolver, MantineProvider, VariantColorsResolverInput } from "@mantine/core"
import "@mantine/core/styles.css"
import { Notifications } from "@mantine/notifications"
import "@mantine/notifications/styles.css"
import { render } from "preact"
import { ErrorBoundary, LocationProvider, Route, Router } from "preact-iso"

import { Evaluator } from "core/evaluator/browser_sandboxed_javascript"

import { useEffect } from "preact/hooks"
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
import { set_page_title } from "./ui_components/set_page_title"


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
                    // These styles override the `color` prop and we can't use
                    // defaultProps: { backgroundColor: "...", color: "..."}
                    // because Mantine only uses the `color` for the background
                    // and we can't set the color of the font.
                    styles: {
                        tooltip: {
                            // Light blue
                            backgroundColor: "#e7f3ff",
                            color: "var(--colour-primary-blue)",
                            border: "1px solid var(--colour-border)",
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
        {/* <DebugInfo /> */}

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
                        {/* <Route path="/demo/json_viewer" component={JsonViewerDemo} /> */}
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
            background: "var(--colour-danger-background)",
            hover: "var(--colour-danger-background-hover)",
            color: "var(--colour-danger-text)",
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

    if (input.variant === "light")
    {
        return {
            background: "rgba(255, 255, 255, 0.4)",
            hover: "var(--mantine-color-grey-0)",
            color: "black",
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
    useEffect(set_page_title, [])

    return <div>
        <h2>404 Not Found</h2>
        <p>The page you are looking for does not exist.</p>
        <p>Please check the URL or return to the <a href="/">home page</a>.</p>
    </div>
}
