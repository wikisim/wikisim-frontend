import { expect } from "chai"

import { deindent } from "./deindent"


describe("deindent", () =>
{
    it("removes common leading whitespace", () =>
    {
        const input = `
            line one
                line two
            line three
        `
        const expected = `line one
    line two
line three`
        const result = deindent(input)
        expect(result).to.equal(expected)
    })

    it("handles no indentation", () =>
    {
        const input = `
line one
line two
line three
        `
        const expected = `line one
line two
line three`
        const result = deindent(input)
        expect(result).to.equal(expected)
    })

    it("handles empty lines", () =>
    {
        const input = `

            line one

                line two

            line three

        `
        const expected = `line one

    line two

line three`
        const result = deindent(input)
        expect(result).to.equal(expected)
    })
})
