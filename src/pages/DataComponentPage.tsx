import { useLocation } from "preact-iso"
import { useEffect, useState } from "preact/hooks"

import { format_data_component_value_to_string } from "core/data/format/format_data_component_value_to_string"
import { DataComponent } from "core/data/interface"
import { prepare_scenario_javascript } from "core/evaluation/prepare_scenario_javascript"
import { evaluate_code_in_browser_sandbox } from "core/evaluator/browser_sandboxed_javascript"
import { EvaluationResponse } from "core/evaluator/interface"

import HistoryIcon from "../assets/history.svg"
import EditOrSaveButton from "../buttons/EditOrSaveButton"
import pub_sub from "../pub_sub"
import { ROUTES } from "../routes"
import { get_async_data_component } from "../state/data_components/accessor"
import { app_store } from "../state/store"
import { get_async_user } from "../state/users/accessor"
import { sanitize_with_TipTap } from "../text_editor/sanitise_html"
import { ErrorMessage } from "../ui_components/ErrorMessage"
import { ExpectationsMet } from "../ui_components/ExpectationMet"
import Loading from "../ui_components/Loading"
import OpenCloseSection from "../ui_components/OpenCloseSection"
import { ScenarioResultsDisplay } from "../ui_components/ScenarioResultsDisplay"
import { is_pure_number } from "../utils/is_pure_number"
import { time_ago_or_date } from "../utils/time_ago_or_date"
import "./DataComponentPage.css"


export function DataComponentPage(props: { user_id_or_name?: string, data_component_id: string, query: Record<string, string> })
{
    const location = useLocation()
    const state = app_store()

    const data_component = get_async_data_component(state, props.data_component_id)
    const { component, status } = data_component

    if (!component)
    {
        if (status === "loading") return <div>Loading data component<Loading /></div>
        if (status === "error") return <div>Error loading data component.</div>
        return <div>Data component not found.</div>
    }


    // Check that if this component has an owner_id, that some kind of user_name
    // was provided in the props, if not, then redirect the page from this wiki
    // page to the user spaces page
    useEffect(() =>
    {
        if (component.owner_id && props.user_id_or_name === undefined)
        {
            const new_user_space_route = ROUTES.DATA_COMPONENT.VIEW_USER_COMPONENT({
                user_id_or_name: component.owner_id,
                id: component.id.as_IdOnly(),
            })
            location.route(new_user_space_route )
        }
    }, [component.owner_id, props.user_id_or_name])


    const async_user = component.owner_id !== undefined ? get_async_user(state, component.owner_id) : undefined
    if (async_user)
    {
        if (async_user.status === "loading") return <div>Loading user<Loading /></div>
    }


    // Check that if this component has an owner_id, that the user_id_or_name
    // provided in the props matches the name of the user given by the owner_id
    // of the component, if not, then redirect the page from this page to the
    // user spaces page give by that name
    useEffect(() =>
    {
        if (component.owner_id && async_user?.status === "loaded")
        {
            const user_name = async_user.user!.name
            if (props.user_id_or_name !== user_name)
            {
                const new_user_space_route = ROUTES.DATA_COMPONENT.VIEW_USER_COMPONENT({
                    user_id_or_name: user_name,
                    id: component.id.as_IdOnly(),
                })
                location.route(new_user_space_route )
            }
        }
    }, [component.owner_id, async_user, props.user_id_or_name])


    // Subscribe to cmd + enter key combo to open the save modal for the component
    useEffect(() => pub_sub.sub("key_down", data =>
    {
        if (data.key !== "Enter" || !data.metaKey) return
        location.route(ROUTES.DATA_COMPONENT.EDIT(component.id.as_IdOnly()))
    }), [component.id.id])

    const value_as_string = format_data_component_value_to_string(component)
    const is_function = component.value_type === "function"
    const is_number_type = component.value_type === "number"
    const value_is_pure_number = is_pure_number(sanitize_with_TipTap(component.input_value || "", true))
    const show_calculation = is_number_type && !value_is_pure_number


    const user_owned = !!component.owner_id
    const unknown_user = user_owned && async_user?.status === "not_found"


    return <div id="data-component">
        {user_owned && <div className="generic-error-message warning">
            This data component belongs to {unknown_user
                ? `an unknown user (ID: ${component.owner_id}).`
                : <a href={ROUTES.USER.VIEW(component.owner_id)}>
                    {async_user?.user?.name}
                </a>}. It is not in the wiki but you can copy anything here into
                your own user pages.
        </div>}
        <div className="page-container">
            <div style={{ float: "right", margin: "10px" }}>
                <EditOrSaveButton
                    editing={false}
                    set_editing={() => location.route(ROUTES.DATA_COMPONENT.EDIT(component.id.as_IdOnly()))}
                />
            </div>

            <h2
                className="section tiptap-content"
                dangerouslySetInnerHTML={{ __html: sanitize_with_TipTap(component.title, true) }}
            />

            {component.plain_description && <div
                className="section tiptap-content"
                dangerouslySetInnerHTML={{ __html: sanitize_with_TipTap(component.description, false) }}
            />}

            {value_as_string && <div className="section">
                {value_as_string && <div className="row">
                    <b>{is_function ? "Function" : "Value"}: </b>
                    {value_as_string}
                </div>}
                {show_calculation && <div className="row">
                    <b>Calculation: </b>
                    <div
                        className="tiptap-content"
                        dangerouslySetInnerHTML={{ __html: sanitize_with_TipTap(component.input_value || "", false) }}
                    />
                </div>}
            </div>}

            {is_function && <Scenarios component={component} />}

        </div>
        <LastEditedBy component={component} />
    </div>
}


function LastEditedBy({ component }: { component: DataComponent })
{
    const store = app_store()

    const { created_at, editor_id } = component
    const user_link = `/user/${editor_id}`

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
            <img src={HistoryIcon} alt="History" width={20} height={20} style={{ verticalAlign: -5, margin: "0px 5px" }} />

            <a href={ROUTES.DATA_COMPONENT.VIEW_VERSION_HISTORY(component.id.as_IdOnly())}>
                Last edited{" "}
                {time_ago_or_date(created_at, true)}{" "}
                {time_ago_or_date(created_at)}
            </a>{" "}
            by <a href={user_link}>{user_name || <Loading />}</a>
        </div>
    )
}


function Scenarios(props: { component: DataComponent })
{
    const [opened, set_opened] = useState(false)

    const { component } = props
    const { scenarios = [] } = component
    if (!scenarios.length) return null


    const [results, set_results] = useState<{[scenario_index: number]: EvaluationResponse}>({})


    useEffect(() =>
    {
        scenarios.forEach(async (scenario, index) =>
        {
            const javascript = prepare_scenario_javascript({ component, scenario })

            const result = await evaluate_code_in_browser_sandbox({
                js_input_value: javascript,
                value_type: component.value_type,
                requested_at: performance.now(),
            })
            set_results(results =>
            {
                results[index] = result
                return { ...results }
            })
        })
    }, [])


    return <div class="scenarios">
        <div
            className="data-component-form-column row"
            style={{ alignItems: "center", justifyContent: "space-between" }}
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
        {opened && scenarios.map((scenario, index) =>
        {
            const result = results[index]

            return <div className="row_to_column scenario-divider" key={scenario.id}>
                <div
                    className="data-component-form-column column"
                    style={{ gap: "var(--gap-common-close)" }}
                >
                    <b>Scenario {index + 1} of {scenarios.length}</b>

                    {scenario.description && <div
                        className="tiptap-content"
                        dangerouslySetInnerHTML={{ __html: sanitize_with_TipTap(scenario.description, false) }}
                    />}
                </div>

                <div className="data-component-form-column column">
                    {result?.error && <ErrorMessage show={true} message={result.error} />}
                    {result?.result && <ScenarioResultsDisplay
                        result={result.result}
                        expected_result={scenario.expected_result}
                        expectation_met={scenario.expectation_met}
                    />}
                </div>
            </div>
        })}
    </div>
}
