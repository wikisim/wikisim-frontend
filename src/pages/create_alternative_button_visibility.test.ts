import { expect } from "chai"

import { should_show_create_alternative_button } from "./create_alternative_button_visibility"


describe("should_show_create_alternative_button", () =>
{
    it("should return false when no according_to_id has been selected", () =>
    {
        expect(should_show_create_alternative_button(0)).to.equal(false)
    })


    it("should return true when a valid according_to_id has been selected", () =>
    {
        expect(should_show_create_alternative_button(42)).to.equal(true)
    })


    it("should return false for invalid selected ids", () =>
    {
        expect(should_show_create_alternative_button(-1)).to.equal(false)
        expect(should_show_create_alternative_button(3.14)).to.equal(false)
    })
})
