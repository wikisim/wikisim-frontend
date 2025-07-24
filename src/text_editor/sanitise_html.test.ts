import { expect } from "chai"

import { sanitize_with_TipTap } from "./sanitise_html"


describe("sanitize_with_TipTap", () =>
{
    it("should sanitize HTML content for single line", () =>
    {
        const input = "<p>This is a <strong>test</strong> content.</p>"
        const output = sanitize_with_TipTap(input, true)
        expect(output).equals("This is a <strong>test</strong> content.")
    })

    it("should sanitize HTML content for multi-line", () =>
    {
        const input = "<div><h1>Title</h1><p>Description</p></div>"
        const output = sanitize_with_TipTap(input, false)
        expect(output).equals("<h1>Title</h1><p>Description</p>")
    })

    it("should handle empty string", () =>
    {
        const output = sanitize_with_TipTap("", true)
        expect(output).equals("")
    })

    it("should handle invalid HTML gracefully", () =>
    {
        const input = "<div><span>Unclosed tag"
        const output = sanitize_with_TipTap(input, false)
        expect(output).equals("<p>Unclosed tag</p>")
    })
})
