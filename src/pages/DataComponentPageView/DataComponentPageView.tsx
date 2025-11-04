import { useLocation } from "preact-iso"
import { useEffect, useMemo, useRef, useState } from "preact/hooks"

import { valid_value_type } from "core/data/field_values_with_defaults"
import { format_data_component_value_to_string } from "core/data/format/format_data_component_value_to_string"
import { DataComponent, Scenario } from "core/data/interface"
import { prepare_scenario_javascript } from "core/evaluation/prepare_scenario_javascript"
import { request_dependencies_and_setup_sandbox } from "core/evaluation/request_dependencies_and_setup_sandbox"
import { evaluate_code_in_browser_sandbox } from "core/evaluator/browser_sandboxed_javascript"
import { EvaluationResponse } from "core/evaluator/interface"
import { browser_convert_tiptap_to_plain } from "core/rich_text/browser_convert_tiptap_to_plain"
import { get_supabase } from "core/supabase/browser"

import { HistoryIcon, RepeatIcon, UsePreviousResultIcon } from "../../assets/icons"
import EditOrSaveButton from "../../buttons/EditOrSaveButton"
import pub_sub from "../../pub_sub"
import { ROUTES } from "../../routes"
import { get_async_data_component } from "../../state/data_components/accessor"
import { CheckIfIdIsLatestResponse } from "../../state/data_components/interface"
import { app_store } from "../../state/store"
import { ReadOnly } from "../../text_editor/sanitise_html"
import { BannerWarningOfUserOwnedPage } from "../../ui_components/BannerWarningOfUserOwnedPage"
import { PlayInteractable } from "../../ui_components/data_component/PlayInteractable"
import { ErrorMessage } from "../../ui_components/ErrorMessage"
import { ExpectationsMet } from "../../ui_components/ExpectationMet"
import Loading from "../../ui_components/Loading"
import OpenCloseSection from "../../ui_components/OpenCloseSection"
import { ScenarioResultsDisplay } from "../../ui_components/results_display/ScenarioResultsDisplay"
import { set_page_title } from "../../ui_components/set_page_title"
import {
    ensure_owner_id_or_name_is_in_url,
    ensure_owner_is_loaded,
    ensure_owner_name_matches_in_url,
} from "../../ui_components/utils/managing_url_for_user_components"
import { is_pure_number } from "../../utils/is_pure_number"
import { time_ago_or_date } from "../../utils/time_ago_or_date"
import "./DataComponentPageView.css"


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


    ensure_owner_id_or_name_is_in_url(props.data_component_id, component, props.user_id_or_name)
    const { async_user, loading_user_jsx } = ensure_owner_is_loaded(state, component)
    if (loading_user_jsx) return loading_user_jsx

    ensure_owner_name_matches_in_url(props.data_component_id, component, async_user, props.user_id_or_name)


    // Subscribe to cmd + enter key combo to open the save modal for the component
    useEffect(() => pub_sub.sub("key_down", data =>
    {
        if (data.key !== "Enter" || !data.metaKey) return
        location.route(ROUTES.DATA_COMPONENT.EDIT(component.id.as_IdOnly()))
    }), [component.id.id])


    useEffect(() => set_page_title(component.plain_title), [component.plain_title])


    const value_as_string = format_data_component_value_to_string(component)
    const value_type = valid_value_type(component.value_type)
    const is_function = value_type === "function"
    const is_number_type = value_type === "number"
    const value_is_pure_number = is_pure_number(browser_convert_tiptap_to_plain(component.input_value || ""))
    const show_calculation = is_number_type && !value_is_pure_number


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
                <ReadOnly html={component.description} />
            </div>}

            {value_as_string && <div className="section">
                <div className="row">
                    <b>{is_function ? "Function" : "Value"}: </b>
                    {is_function ? "" : value_as_string}
                </div>

                {is_function && <ReadOnly html={component.input_value} is_code={true}/>}

                {show_calculation && <div className="row">
                    <b>Calculation: </b>
                    <ReadOnly html={component.input_value} is_code={true}/>
                </div>}
            </div>}

            {is_function && <ScenariosReadOnly component={component} />}

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

    return (
        <div className="last-edited-by">
            <HistoryIcon />

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
    )
}


function ScenariosReadOnly(props: { component: DataComponent })
{
    const [opened, set_opened] = useState(false)

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


    return <div class="scenarios">
        <div
            className="data-component-form-column row"
            style={{ alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
            onPointerDown={() => set_opened(!opened)}
        >
            <div style={{ display: "flex", alignItems: "center", flexDirection: "row", gap: "0.5em" }}>
                <h4>Scenarios</h4>
                <ExpectationsMet
                    scenarios={scenarios}
                    all_scenario_results={results}
                />
            </div>
            <OpenCloseSection opened={opened} />
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
    const { scenario, index, scenarios_count, result } = props
    const [scenario_row_opened, set_scenario_row_opened] = useState(false)

    const input_values = Object.entries(scenario.values_by_temp_id)

    return <div className="row_to_column scenario-divider" key={scenario.local_temp_id}>
        <div
            className="data-component-form-column column"
            style={{ gap: "var(--vgap-small)", cursor: "pointer" }}
            onClick={() => set_scenario_row_opened(!scenario_row_opened)}
        >
            <b>Scenario {index + 1} of {scenarios_count}</b>

            <ReadOnly html={scenario.description} />

            {scenario_row_opened && input_values.length > 0 && <>
                <h4 style={{ marginBottom: "0px" }}>
                    Input Values
                </h4>
                <pre style={{ marginTop: "0px" }} className="make-pre-text-wrap">
                    {input_values.map(([local_temp_id, val]) =>
                    {
                        return <>
                            {props.input_temp_id_to_arg_name(local_temp_id)} = {val.value} &nbsp;
                            {val.iterate_over && <RepeatIcon />}
                            {val.use_previous_result && <UsePreviousResultIcon />}
                            <br/>
                        </>
                    })}
                </pre>
            </>}
        </div>

        <div className="data-component-form-column column">
            {result?.error && <ErrorMessage show={true} message={result.error} />}
            {result?.result && <ScenarioResultsDisplay
                result={result.result}
                expected_result={scenario.expected_result}
                expectation_met={scenario.expectation_met}
                scenario_row_opened={scenario_row_opened}
                set_scenario_row_opened={set_scenario_row_opened}
            />}
        </div>
    </div>
}
