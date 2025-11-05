import stringify from "json-stringify-pretty-compact"
import { useCallback, useMemo, useState } from "preact/hooks"

import {
    assert_result_json_is_graphable,
    result_string_to_json
} from "core/evaluation/parse_result"
import { Json } from "core/supabase/interface"

import {
    event_and_state_handlers,
    JSONViewerEventAndStateHandlers
} from "../data_wrangling/event_and_state_handlers"
import { extract_selected_data } from "../data_wrangling/extract_selected_data"
import { GraphViewer } from "../data_wrangling/GraphViewer"
import { JSONViewer } from "../data_wrangling/JSONViewer"
import { TableViewer } from "../data_wrangling/TableViewer"
import { ExpectationMet } from "../ExpectationMet"
import { ResultsViewType } from "./interface"
import { ResultsViewTabs } from "./ResultsViewTabs"
import "./ScenarioResultsDisplay.css"
import { ScenarioResultsDisplayGraphical } from "./ScenarioResultsDisplayGraphical"



interface ScenarioResultsDisplayProps
{
    result: string
    expected_result: string | undefined
    expectation_met: boolean | undefined
    scenario_row_opened: boolean
    set_scenario_row_opened: (opened: boolean | ((o: boolean) => boolean)) => void
}

export function ScenarioResultsDisplay(props: ScenarioResultsDisplayProps)
{
    const on_click_header = useCallback(() =>
    {
        props.set_scenario_row_opened(scenario_row_opened => !scenario_row_opened)
    }, [props.set_scenario_row_opened])

    const [selected_tab, set_selected_tab] = useState<ResultsViewType>("json")
    const json_viewer_event_and_state_handlers = event_and_state_handlers()

    const extracted_data = useMemo(() =>
    {
        const data = result_string_to_json(props.result)?.parsed

        return extract_selected_data(data, json_viewer_event_and_state_handlers.selected_paths)
    }, [props.result, json_viewer_event_and_state_handlers.selected_paths])

    return <div className="scenario-results-display">

        <ExpectationMet
            met={props.expectation_met}
            on_click={on_click_header}
        />

        {props.scenario_row_opened && <ResultsViewTabs
            selected_tab={selected_tab}
            on_select_tab={set_selected_tab}
            selected_paths={json_viewer_event_and_state_handlers.selected_paths}
        />}

        <ScenarioResultsDisplayInner
            show={props.scenario_row_opened && selected_tab === "json"}
            result={props.result}
            expected_result={props.expected_result}
            expectation_met={props.expectation_met}
            json_viewer_event_and_state_handlers={json_viewer_event_and_state_handlers}
        />

        {props.scenario_row_opened && selected_tab === "table" && <TableViewer
            extracted_data={extracted_data}
        />}

        {props.scenario_row_opened && selected_tab === "graph" && <GraphViewer
            data_columns={extracted_data.columns}
        />}
    </div>
}


interface ScenarioResultsDisplayInnerProps
{
    show: boolean
    result: string
    expected_result: string | undefined
    expectation_met: boolean | undefined
    json_viewer_event_and_state_handlers?: JSONViewerEventAndStateHandlers
}
function ScenarioResultsDisplayInner(props: ScenarioResultsDisplayInnerProps)
{
    const parsed_json = result_string_to_json(props.result)

    if (!parsed_json)
    {
        if (!props.show) return null

        return <pre className="make-pre-text-wrap generic-error-message">
            Error: Unabled to parse JSON from result: {props.result}<br/>
        </pre>
    }

    const data = assert_result_json_is_graphable(parsed_json.parsed)
    if (!data)
    {
        return <ScenarioResultsDisplayPlainJSON {...props} parsed_json={parsed_json.parsed} />
    }

    if (!props.show) return null

    return <ScenarioResultsDisplayGraphical {...props} data={data} />
}


interface ScenarioResultsDisplayPlainJSONProps
{
    show: boolean
    expected_result: string | undefined
    expectation_met: boolean | undefined
    json_viewer_event_and_state_handlers?: JSONViewerEventAndStateHandlers
    parsed_json: Json | undefined
}
function ScenarioResultsDisplayPlainJSON(props: ScenarioResultsDisplayPlainJSONProps)
{
    const expected_json = result_string_to_json(props.expected_result || "")
    const expected_result_str = expected_json ? stringify(expected_json.parsed, { maxLength: 60 }) : props.expected_result

    return <div style={{ display: props.show ? "" : "none"}}>
        <div>Result:</div>
        <pre style={{ marginTop: 0 }}>
            {/* {stringify(props.parsed_json, { maxLength: 60 })}<br/> */}
            {props.parsed_json ? <JSONViewer
                data={props.parsed_json}
                initial_collapsed_to_level={2}
                {...props.json_viewer_event_and_state_handlers}
            /> : "undefined"}
        </pre>
        {props.expectation_met !== undefined && <pre className="make-pre-text-wrap">
            {props.expectation_met && `Result matched expected result` }
            {!props.expectation_met && expected_result_str && `Expected = ${expected_result_str}`}<br/>
        </pre>}
    </div>
}
