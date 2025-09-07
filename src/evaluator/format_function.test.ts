import { expect } from "chai"

import { FunctionArgument } from "core/data/interface"
import { deindent } from "core/utils/deindent"

import { format_function_input_value_string } from "./format_function"
import { EvaluationRequest } from "./interface"


describe("format_function_input_value_string", () =>
{
    const value_type = "function"
    const function_arguments: FunctionArgument[] = [
        // Swap around the order to ensure formatting uses argument
        // positions not names
        { id: 0, name: "min", value_type: "number", default_value: "0" },
        { id: 1, name: "value", value_type: "number" },
    ]


    it("formats a single line function correctly", () =>
    {
        const basic_request: EvaluationRequest = {
            value: "Math.max(value, min)",
            value_type,
            function_arguments,
        }
        const { result } = format_function_input_value_string(basic_request)
        expect(result).to.equal("(min = 0, value) => Math.max(value, min)")
    })


    it("does not use empty default_value", () =>
    {
        const function_arguments: FunctionArgument[] = [
            { id: 0, name: "min", value_type: "number", default_value: "" }
        ]
        const basic_request: EvaluationRequest = {
            value: "Math.max(1, min)",
            value_type,
            function_arguments,
        }
        const { result } = format_function_input_value_string(basic_request)
        expect(result).to.equal("(min) => Math.max(1, min)")
    })


    it("formats a multi-line function with a return correctly", () =>
    {
        const basic_request: EvaluationRequest = {
            value: `
            result = Math.max(min, value)
            return result`,
            value_type,
            function_arguments,
        }
        const { result } = format_function_input_value_string(basic_request)
        expect(result).to.equal(deindent(`
        (min = 0, value) => {
            result = Math.max(min, value)
            return result
        }`))
    })


    it("formats a multi-line function without a return by auto inserting return", () =>
    {
        const basic_request: EvaluationRequest = {
            value: `
            result = Math.max(min, value)
            result + 1`,
            value_type,
            function_arguments,
        }
        const { result } = format_function_input_value_string(basic_request)
        expect(result).to.equal(deindent(`
        (min = 0, value) => {
            result = Math.max(min, value)
            return result + 1
        }`))
    })
})
