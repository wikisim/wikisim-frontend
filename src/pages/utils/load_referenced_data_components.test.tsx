import { render } from "@testing-library/preact"
import { expect } from "chai"
import { stub } from "sinon"
import { z } from "zod"

import { DataComponent, NewDataComponent } from "core/data/interface"
import { init_data_component } from "core/data/modify"
import { tiptap_mention_chip } from "core/test/fixtures"

import { hydrate_data_component_from_json } from "../../../lib/core/src/data/convert_between_json"
import { make_field_validators } from "../../../lib/core/src/data/validate_fields"
import { RootAppState } from "../../state/interface"
import { load_referenced_data_components } from "./load_referenced_data_components"


// Test wrapper component to provide Preact context for hooks
interface TestWrapperProps
{
    state: RootAppState
    data_component: DataComponent | NewDataComponent
}
function TestWrapper(props: TestWrapperProps)
{
    const { state, data_component } = props

    const result = load_referenced_data_components(state, data_component)
    return <div data-testid="result">{JSON.stringify(result)}</div>
}


function get_mocked_state()
{
    return {
        data_components: {
            request_data_components: stub(),
            data_component_by_id_and_maybe_version: {}
        }
    }
}


describe("load_referenced_data_components", () =>
{
    const dc3 = init_data_component({ id: "-3v1" })
    const dc4 = init_data_component({ id: "-4v1" })
    let mock_state = get_mocked_state()

    beforeEach(() => mock_state = get_mocked_state())


    function test_helper_run_load_referenced_data_components(input_value: string): object
    {
        const data_component = init_data_component({ input_value })

        const { getByTestId } = render(
            // @ts-expect-error
            <TestWrapper state={mock_state} data_component={data_component} />
        )

        /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
        const parsed = JSON.parse(getByTestId("result").textContent || "null")

        // For these tests just re-hydrate the data components from JSON to make
        // it easier to compare.
        const validators = make_field_validators(z)
        Object.entries(parsed.referenced_data_components).forEach(([key, value]: any) =>
        {
            const { id, version } = value.id
            value.id = id
            value.version_number = version
            parsed.referenced_data_components[key] = hydrate_data_component_from_json(value, validators)
        })
        /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return parsed
    }


    it("should return with status of loading when components are still loading", () =>
    {
        mock_state.data_components.request_data_components.returns([
            { status: "loaded", component: dc3 },
            { status: "loading", component: null }, // <-- One is still loading
        ])

        const result = test_helper_run_load_referenced_data_components(
            `<p>${tiptap_mention_chip(dc3)} + ${tiptap_mention_chip(dc4)}</p>`
        )

        expect(result).deep.equals({
            status: "loading",
            loading_count: 1,
            referenced_data_component_count: 2,
            referenced_data_components: {
                "-3v1": dc3,
            },
        })
    })


    it("should return loaded when components are all loaded", () =>
    {
        mock_state.data_components.request_data_components.returns([
            { status: "loaded", component: dc3 },
            { status: "loaded", component: dc4 },
        ])

        const result = test_helper_run_load_referenced_data_components(
            `<p>${tiptap_mention_chip(dc3)} + ${tiptap_mention_chip(dc4)}</p>`
        )

        expect(result).to.deep.equal({
            status: "loaded",
            loading_count: 0,
            referenced_data_component_count: 2,
            referenced_data_components: {
                "-3v1": dc3,
                "-4v1": dc4,
            },
        })
    })


    it("should handle empty input_value", () =>
    {
        mock_state.data_components.request_data_components.returns([])

        const result = test_helper_run_load_referenced_data_components(
            `<p>3 + 4</p>`
        )

        expect(result).to.deep.equal({
            status: "loaded",
            loading_count: 0,
            referenced_data_component_count: 0,
            referenced_data_components: {},
        })
    })
})
