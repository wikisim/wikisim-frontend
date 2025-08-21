/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from "chai"
import { describe } from "mocha"

import { is_pure_number } from "./is_pure_number"


describe("is_pure_number", () =>
{
    it("should return true for pure numbers", () =>
    {
        expect(is_pure_number("123")).to.be.true
        expect(is_pure_number("  456  ")).to.be.true
        expect(is_pure_number("0")).to.be.true
        expect(is_pure_number("-789")).to.be.true
        expect(is_pure_number("9e4")).to.be.true
        expect(is_pure_number("-9e-4")).to.be.true
    })

    it("should return false for non-numeric strings", () =>
    {
        expect(is_pure_number("abc")).to.be.false
        expect(is_pure_number("123abc")).to.be.false
        expect(is_pure_number("1.2.3")).to.be.false
    })

    it("should return false for empty or undefined values", () =>
    {
        expect(is_pure_number(undefined)).to.be.false
        expect(is_pure_number("")).to.be.false
    })

    it("should return false for multi-line values", () =>
    {
        expect(is_pure_number("1\n2\n3")).to.be.false
    })
})
