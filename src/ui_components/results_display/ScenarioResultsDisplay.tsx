import stringify from "json-stringify-pretty-compact"
import { useCallback, useEffect, useMemo, useState } from "preact/hooks"

import { Scenario } from "core/data/interface"
import {
    assert_result_json_is_graphable,
    result_string_to_json
} from "core/evaluation/parse_result"
import { Json } from "core/supabase/interface"

import { extract_selected_data } from "../data_wrangling/extract_selected_data"
import { GraphViewer } from "../data_wrangling/GraphViewer"
import {
    get_json_data_handlers,
    JSONViewerEventAndStateHandlers
} from "../data_wrangling/json_data_handlers"
import { JSONViewer } from "../data_wrangling/JSONViewer"
import { TableViewer } from "../data_wrangling/TableViewer"
import { ExpectationMet } from "../ExpectationMet"
import { ResultsViewType } from "./interface"
import { ResultsViewTabs } from "./ResultsViewTabs"
import "./ScenarioResultsDisplay.css"
import { ScenarioResultsDisplayGraphical } from "./ScenarioResultsDisplayGraphical"



type ScenarioResultsDisplayProps =
{
    result: string
    scenario_row_opened: boolean
    set_scenario_row_opened: (opened: boolean | ((o: boolean) => boolean)) => void

    scenario: Scenario
    on_upsert_scenario?: (updated_scenario: Partial<Scenario>) => void
    // on_change_scenario?: (scenario_updater: (current_scenario: Scenario) => Scenario) => void
} & ({
    selected_tab: ResultsViewType
    set_selected_tab: (tab: ResultsViewType) => void
} | {
    selected_tab?: undefined
    set_selected_tab?: undefined
})

export function ScenarioResultsDisplay(props: ScenarioResultsDisplayProps)
{
    const on_click_scenario_header = useCallback(() =>
    {
        props.set_scenario_row_opened(scenario_row_opened => !scenario_row_opened)
    }, [props.set_scenario_row_opened])

    const json_data_handlers = get_json_data_handlers(props.scenario, props.on_upsert_scenario)


    const extracted_data = useMemo(() =>
    {
        const data = result_string_to_json(props.result)?.parsed
        return extract_selected_data(data, json_data_handlers.selected_paths)
    }, [props.result, json_data_handlers.selected_paths])

    const [selected_tab, set_selected_tab] = props.selected_tab !== undefined
        ? [props.selected_tab, props.set_selected_tab]
        : useState<ResultsViewType>("json")

    useEffect(() =>
    {
        if (extracted_data.used_paths.length === 0) return

        // When component first mounts, if there is graphable data, default to
        // showing this and opening this scenario.  Otherwise if no graphable data,
        // but there are data paths selected, then show the table view but don't
        // open the scenario automatically.
        if (extracted_data.has_graphable_data)
        {
            props.set_scenario_row_opened(() => true)
            set_selected_tab("graph")
        } else set_selected_tab("table")
    }, [])


    return <div className="scenario-results-display">

        <ExpectationMet
            met={props.scenario.expectation_met}
            on_click={on_click_scenario_header}
        />

        {props.scenario_row_opened && <ResultsViewTabs
            selected_tab={selected_tab}
            on_select_tab={set_selected_tab}
            valid_selected_paths={extracted_data.used_paths}
            has_graphable_data={extracted_data.has_graphable_data}
        />}

        <ScenarioResultsDisplayInner
            show={props.scenario_row_opened && selected_tab === "json"}
            result={props.result}
            expected_result={props.scenario.expected_result}
            expectation_met={props.scenario.expectation_met}
            json_data_handlers={json_data_handlers}
        />

        {props.scenario_row_opened && selected_tab === "table" && <TableViewer
            selected_paths={json_data_handlers.selected_paths}
            selected_path_names={json_data_handlers.selected_path_names}
            upsert_path_name={json_data_handlers.upsert_selected_path_name}
            extracted_data={extracted_data}
        />}

        {props.scenario_row_opened && selected_tab === "graph" && <GraphViewer
            data_columns={extracted_data.columns}
            selected_path_names={json_data_handlers.selected_path_names}
        />}
    </div>
}


interface ScenarioResultsDisplayInnerProps
{
    show: boolean
    result: string
    expected_result: string | undefined
    expectation_met: boolean | undefined
    json_data_handlers?: JSONViewerEventAndStateHandlers
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
    json_data_handlers?: JSONViewerEventAndStateHandlers
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
                {...props.json_data_handlers}
            /> : "undefined"}
        </pre>
        {props.expectation_met !== undefined && <pre className="make-pre-text-wrap">
            {props.expectation_met && `Result matched expected result` }
            {!props.expectation_met && expected_result_str && `Expected = ${expected_result_str}`}<br/>
        </pre>}
    </div>
}
