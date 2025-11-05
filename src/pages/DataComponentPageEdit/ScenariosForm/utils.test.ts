import { expect } from "chai"

import { Scenario } from "core/data/interface"

import { scenario_is_empty } from "./utils"


describe("scenario_is_empty", function()
{
    function fixture_empty_scenario(override: Partial<Scenario> = {}): Scenario
    {
        const { values_by_temp_id, ...rest } = override

        return {
            local_temp_id: "1",
            description: "<p>   </p>",
            values_by_temp_id: {
                "an_input_a": { value: "   " },
                "some_input_b": { value: "" },
                ...values_by_temp_id,
            },
            ...rest,
        }
    }

    it("returns true for empty scenario", function()
    {
        const scenario = fixture_empty_scenario()
        expect(scenario_is_empty(scenario)).equals(true)
    })

    it("returns false for non-empty description", function()
    {
        const scenario = fixture_empty_scenario({
            description: "<p>Not empty</p>",
        })
        expect(scenario_is_empty(scenario)).equals(false)
    })

    it("returns false for non-empty value", function()
    {
        const scenario = fixture_empty_scenario({
            values_by_temp_id: {
                "an_input_a": { value: "Some value" },
                "some_input_b": { value: "" },
            },
        })
        expect(scenario_is_empty(scenario)).equals(false)
    })

    it("returns false for values with a iterate (repeat) over flag set", function()
    {
        const scenario = fixture_empty_scenario({
            values_by_temp_id: {
                "an_input_a": { value: "", iterate_over: true },
                "some_input_b": { value: "" },
            },
        })
        expect(scenario_is_empty(scenario)).equals(false)
    })

    it("returns true for values with only a use previous result flag set", function()
    {
        const scenario = fixture_empty_scenario({
            values_by_temp_id: {
                "an_input_a": { value: "", use_previous_result: true },
                "some_input_b": { value: "" },
            },
        })
        expect(scenario_is_empty(scenario)).equals(true)
    })
})
