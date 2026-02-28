import { useLocation } from "preact-iso"
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks"

import { valid_value_type } from "core/data/field_values_with_defaults"
import { format_data_component_value_to_string } from "core/data/format/format_data_component_value_to_string"
import { DataComponent, Scenario } from "core/data/interface"
import { prepare_scenario_javascript } from "core/evaluation/prepare_scenario_javascript"
import { request_dependencies_and_setup_sandbox } from "core/evaluation/request_dependencies_and_setup_sandbox"
import { evaluate_code_in_browser_sandbox } from "core/evaluator/browser_sandboxed_javascript"
import { EvaluationResponse } from "core/evaluator/interface"
import { browser_convert_tiptap_to_plain } from "core/rich_text/browser_convert_tiptap_to_plain"
import { get_supabase } from "core/supabase/browser"

import { IconHistory, IconRepeat, IconUsePreviousResult } from "../../assets/icons"
import EditOrSaveButton from "../../buttons/EditOrSaveButton"
import pub_sub from "../../pub_sub"
import { ROUTES } from "../../routes"
import { get_async_data_component } from "../../state/data_components/accessor"
import { CheckIfIdIsLatestResponse } from "../../state/data_components/interface"
import { app_store } from "../../state/store"
import { ReadOnlyFunction } from "../../text_editor/santisise_html/ReadOnlyFunction"
import { ReadOnly } from "../../text_editor/santisise_html/sanitise_html"
import { PlayInteractable } from "../../ui_components/data_component/PlayInteractable"
import { ExpectationsMet } from "../../ui_components/ExpectationMet"
import { BannerWarningOfUserOwnedPage } from "../../ui_components/info_and_errors/BannerWarningOfUserOwnedPage"
import { ErrorMessage } from "../../ui_components/info_and_errors/ErrorMessage"
import Loading from "../../ui_components/Loading"
import OpenCloseSection from "../../ui_components/OpenCloseSection"
import { ScenarioResultsDisplay } from "../../ui_components/results_display/ScenarioResultsDisplay"
import { set_page_title } from "../../ui_components/set_page_title"
import {
    ensure_owner_is_loaded,
    ensure_owner_name_matches_in_url,
} from "../../ui_components/utils/managing_url_for_user_components"
import { is_small_screen } from "../../utils/is_mobile_device"
import { is_pure_number } from "../../utils/is_pure_number"
import { time_ago_or_date } from "../../utils/time_ago_or_date"
import "./DataComponentPageView.css"
import { highlight_text_fragment } from "./highlight_text_fragment"


interface DataComponentPageViewProps
{
    user_id_or_name?: string
    data_component_id: string
    query: Record<string, string>
}
export function DataComponentPageView(props: DataComponentPageViewProps)
{
    const location = useLocation()
    const state = app_store()

    // Handle scenario when a page like https://wikisim.org/wiki/1021v5 is loaded
    // and then the user clicks on the link to https://wikisim.org/wiki/1021v6
    // We need to detect that the ID has changed and then force a refresh of the data
    const data_component_id_ref = useRef(props.data_component_id)
    let force_refresh = false
    if (data_component_id_ref.current !== props.data_component_id)
    {
        data_component_id_ref.current = props.data_component_id
        force_refresh = true
    }

    const async_data_component = get_async_data_component(state, props.data_component_id, force_refresh)
    const { component, status } = async_data_component

    if (!component)
    {
        if (status === "loading") return <div>Loading page<Loading /></div>
        if (status === "error") return <div>Error loading page.</div>
        return <div>Page not found.</div>
    }


    // Don't seem to need this now, seems that `ensure_owner_name_matches_in_url` is sufficient
    // ensure_owner_id_or_name_is_in_url(props.data_component_id, component, props.user_id_or_name)
    const { async_user, loading_user_jsx } = ensure_owner_is_loaded(state, component)
    if (loading_user_jsx) return loading_user_jsx

    ensure_owner_name_matches_in_url(props.data_component_id, component, async_user, props.user_id_or_name)


    // Subscribe to cmd + enter key combo to open the save modal for the component
    useEffect(() => pub_sub.sub("key_down", data =>
    {
        if (data.key !== "Enter" || !data.metaKey) return
        location.route(ROUTES.DATA_COMPONENT.EDIT(component.id.as_IdOnly()))
    }), [component.id.id])


    // document.title is used to trigger set_page_title when on a user pages
    // as these pages redirect to the correct URL with the owner's name in it...
    // and thatt will cause the route_changed event to be fired and clear the
    // page title, so we need to call set_page_title a second time.
    useEffect(() => set_page_title(component.plain_title), [component.plain_title, document.title])


    const value_as_string = format_data_component_value_to_string(component)
    const value_type = valid_value_type(component.value_type)
    const is_function = value_type === "function"
    const is_number_type = value_type === "number"
    const value_is_pure_number = is_pure_number(browser_convert_tiptap_to_plain(component.input_value || ""))
    const show_calculation = is_number_type && !value_is_pure_number
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const show_function_lower = 2 > 1 // true for now as we want to experiment this layout of showing the function scenarios first

    return <div id="data-component">

        <BannerWarningOfUserOwnedPage component={component} />

        <BannerWarningIfOlderVersion partial_component={component} />

        <div className="page-container">
            <div style={{ float: "right", margin: "10px" }}>
                <EditOrSaveButton
                    editing={false}
                    set_editing={() => location.route(ROUTES.DATA_COMPONENT.EDIT(component.id.as_IdOnly()))}
                />
            </div>

            <h2 className="section tiptap-content">
                <ReadOnly html={component.title} single_line={true} />
            </h2>

            <PlayInteractable component={component} />

            {component.plain_description && <div className="section tiptap-content">
                <ReadOnly html={component.description} on_create={highlight_text_fragment} />
            </div>}

            {value_as_string && (!is_function || !show_function_lower) && <div className="section">
                <div className="row">
                    <b>{is_function ? "Function:" : "Value:"} </b>
                    {is_function ? "" : value_as_string}
                </div>

                {is_function && <ReadOnlyFunction component={component} />}

                {show_calculation && <div className="row">
                    <b>Calculation: </b>
                    <ReadOnly html={component.input_value} is_code={true}/>
                </div>}
            </div>}

            {is_function && <ScenariosReadOnly component={component} />}

            {value_as_string && is_function && show_function_lower && <div className="section">
                <div className="row">
                    <b>Function:</b>
                </div>

                <ReadOnlyFunction component={component} />
            </div>}

        </div>
        <LastEditedBy component={component} />
    </div>
}


function BannerWarningIfOlderVersion({ partial_component }: { partial_component: Pick<DataComponent, "id" | "owner_id"> })
{
    const state = app_store()

    const [latest_version_check_response, set_latest_version_check_response] = useState<CheckIfIdIsLatestResponse | null>(null)
    useEffect(() =>
    {
        // Race condition here if the component ID changes very quickly then
        // previous request with now irrelevant data might overwrite a more
        // recent request.  Unlikely though.
        state.data_components.request_check_if_id_is_latest(partial_component.id)
        .then(set_latest_version_check_response)
    }, [partial_component.id.to_str()])

    // return <div>latest_version_check_response: {JSON.stringify(latest_version_check_response)}</div>

    if (!latest_version_check_response) return null
    if (latest_version_check_response.is_latest) return null
    if (latest_version_check_response.error) return null

    const url_to_latest = ROUTES.DATA_COMPONENT.VIEW({
        id: partial_component.id.as_IdOnly(),
        owner_id: partial_component.owner_id,
    })

    return <div className="generic-error-message warning">
        You are viewing an older version of this page (v{partial_component.id.version}).
        A <a href={url_to_latest}>
            newer version (v{latest_version_check_response.latest_version.version}) is available
        </a>.
    </div>
}


function LastEditedBy({ component }: { component: DataComponent })
{
    const store = app_store()

    const { created_at, editor_id } = component
    const user_link = ROUTES.USER.VIEW(editor_id)

    const [user_name, set_user_name] = useState("")
    const async_user = store.users.request_user(editor_id)

    useEffect(() =>
    {
        if (async_user.status === "loaded")
        {
            set_user_name(async_user.user!.name)
        }
        else if (async_user.status === "error" || async_user.status === "not_found")
        {
            set_user_name("Unknown User")
        }
    }, [async_user])

    useEffect(() =>
    {
        const jsx = <div className="last-edited-by">
            <IconHistory />

            <a href={ROUTES.DATA_COMPONENT.VIEW({
                id: component.id.to_str(), // include version
                owner_id: component.owner_id,
            })}>
                v{component.id.version}
            </a> last edited{" "}
            <a href={ROUTES.DATA_COMPONENT.VIEW_VERSION_HISTORY(component.id.as_IdOnly())}>
                {time_ago_or_date(created_at, true)}{" "}
                {time_ago_or_date(created_at)}
            </a>{" "}
            by <a href={user_link}>{user_name || <Loading />}</a>
        </div>

        const request_id = Date.now()
        pub_sub.pub("set_page_footer", { jsx, request_id })
        return () => pub_sub.pub("set_page_footer", { jsx: null, request_id})

    }, [component, user_link, user_name, created_at])

    return null
}


function ScenariosReadOnly(props: { component: DataComponent })
{
    const [opened, set_opened] = useState(true)
    const toggle_opened = useCallback((e: PointerEvent) =>
    {
        e.stopImmediatePropagation()
        set_opened(opened => !opened)
    }, [set_opened])

    const { component } = props
    const { scenarios = [] } = component
    if (!scenarios.length) return null


    const [sandbox_error, set_sandbox_error] = useState<null | false | Error>(null)
    const [results, set_results] = useState<{[scenario_index: number]: EvaluationResponse}>({})


    // Load dependencies
    useEffect(() =>
    {
        // This will result in the component being reqeuested a second time
        // but as we're likely to load multiple dependent components then it
        // won't make much difference
        request_dependencies_and_setup_sandbox(get_supabase, component.id, false)
        .then(response => set_sandbox_error(response.error || false))
    })


    useEffect(() =>
    {
        if (sandbox_error === null || sandbox_error) return

        scenarios.forEach(async (scenario, index) =>
        {
            const javascript = prepare_scenario_javascript({
                component,
                scenario,
                debugging: false,
            })

            const result = await evaluate_code_in_browser_sandbox({
                js_input_value: javascript,
                requested_at: performance.now(),
            })
            set_results(results =>
            {
                results[index] = result
                return { ...results }
            })
        })
    }, [sandbox_error, scenarios, component.result_value, component.function_arguments])


    const input_temp_id_to_arg_name = useMemo(() =>
    {
        const function_arg_temp_id_to_name: {[temp_id: string]: string} = {}
        ;(component.function_arguments || []).forEach(arg =>
        {
            function_arg_temp_id_to_name[arg.local_temp_id] = arg.name
        })

        return (temp_id: string) => {

            const arg_name = function_arg_temp_id_to_name[temp_id]
            if (arg_name === undefined)
            {
                console.error("missing function_argument_name for temp_id:", temp_id, function_arg_temp_id_to_name)
            }
            return arg_name
        }
    }, [component.function_arguments])


    return <div className="scenarios">
        <div
            className="data-component-form-column row"
            style={{
                alignItems: "center",
                justifyContent: "space-between",
                cursor: is_small_screen() ? "default" : "pointer",
            }}
            onPointerDown={e => (!is_small_screen() && toggle_opened(e))}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "row",
                    gap: "0.5em",
                    cursor: "pointer",
                }}
                onPointerDown={toggle_opened}
            >
                <h4>Scenarios</h4>
                <ExpectationsMet
                    scenarios={scenarios}
                    all_scenario_results={results}
                />
            </div>
            <OpenCloseSection opened={opened} on_pointer_down={toggle_opened} />
        </div>

        {sandbox_error && <div className="data-component-form-column">
            <ErrorMessage show={true} message={"Error running scenarios: " + sandbox_error.message} />
        </div>}

        {opened && scenarios.map((scenario, index) =>
        {
            const result = results[index]

            return <ScenarioRowReadOnly
                input_temp_id_to_arg_name={input_temp_id_to_arg_name}
                scenario={scenario}
                index={index}
                scenarios_count={scenarios.length}
                result={result}
            />
        })}
    </div>
}


interface ScenarioRowReadOnlyProps
{
    input_temp_id_to_arg_name: (temp_id: string) => string | undefined
    scenario: Scenario
    index: number
    scenarios_count: number
    result: EvaluationResponse | undefined
}
function ScenarioRowReadOnly(props: ScenarioRowReadOnlyProps)
{
    const { index, result } = props
    const [scenario, set_scenario] = useState(props.scenario)
    // 2026-02-28
    // By default, open all scenario rows because whilst the minimal look is nice
    // I think for now it's important to show readers what the scenarios are doing
    // without them having to click to open them.  For example for this component:
    // https://wikisim.org/wiki/1193v1, being able to see what scenario was run
    // gives a lot more context to what the function is doing.
    const [scenario_row_opened, set_scenario_row_opened] = useState(true)

    // We allow updating of the scenario so that people can select different
    // data from a model to view in the table and graph views, without having to
    // swap to editing mode.
    const on_upsert_scenario = useCallback((updates: Partial<Scenario>) =>
    {
        set_scenario(scenario => ({ ...scenario, ...updates }))
    }, [set_scenario])

    const input_values = Object.entries(scenario.values_by_temp_id)

    const any_modifiers = input_values.some(([_, val]) => val.iterate_over || val.use_previous_result)

    const header_openable_class = is_small_screen() ? " header_not_openable" : " header_openable"

    return <div className="row_to_column scenario-divider" key={scenario.local_temp_id}>
        <div
            className="data-component-form-column column scenario-row"
        >
            <div
                className={"scenario-header" + header_openable_class}
                onClick={() => !is_small_screen() && set_scenario_row_opened(!scenario_row_opened)}
            >
                <b
                    className="scenario-title"
                    onClick={() => is_small_screen() && set_scenario_row_opened(!scenario_row_opened)}
                >
                    Scenario {index + 1}
                </b> {/* of {props.scenarios_count} */}

                <ReadOnly html={scenario.description} />
            </div>

            {scenario_row_opened && input_values.length > 0 && <div className="scenario-input-values">
                <h4 style={{ marginBottom: "0px" }}>
                    Input values
                </h4>
                {input_values.map(([local_temp_id, val]) =>
                    <div style={{ display: "flex", gap: "0.5em", margin: "var(--vgap-mid) 0px" }}>
                        {any_modifiers && <div style={{ width: 20, marginRight: 5 }}>
                            {val.iterate_over && <IconRepeat />}
                            {val.use_previous_result && <IconUsePreviousResult />}
                        </div>}
                        <pre style={{ margin: "-2px 0px 0px 0px" }} className="make-pre-text-wrap">
                            {props.input_temp_id_to_arg_name(local_temp_id)}{val.value ? ` = ${val.value}` : ""} &nbsp;
                        </pre>
                    </div>
                )}
            </div>}
        </div>

        <div className="data-component-form-column column">
            {result?.error && <ErrorMessage show={true} message={result.error} />}
            {result?.result && <ScenarioResultsDisplay
                result={result.result}
                scenario={scenario}
                scenario_row_opened={scenario_row_opened}
                set_scenario_row_opened={set_scenario_row_opened}
                on_upsert_scenario={on_upsert_scenario}
                editing={false}
            />}
        </div>
    </div>
}
