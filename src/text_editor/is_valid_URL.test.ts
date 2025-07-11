import { expect } from "chai"

import { is_valid_URL } from "./is_valid_URL"


describe("is_valid_URL", () => {
    it("should return true for valid URLs", () => {
        expect(is_valid_URL("https://example.com")).equals(true)
        expect(is_valid_URL("http://example.com")).equals(true)
        expect(is_valid_URL("www.example.com")).equals(true)
        expect(is_valid_URL("example.com")).equals(true)
        expect(is_valid_URL("a.com")).equals(true)
        expect(is_valid_URL("https://subdomain.example.com/path?query=123#fragment")).equals(true)
        expect(is_valid_URL("subdomain.example.com/path?query=123#fragment")).equals(true)
        // handles trailing whitespace
        expect(is_valid_URL("example.com  ")).equals(true)
        // Seems to be handled as valid by URL constructor and browsers
        expect(is_valid_URL("http:/invalid.com")).equals(true)
    })

    it("should return false for invalid URLs", () => {
        expect(is_valid_URL("invalid-url")).equals(false)
        // rejects prepended whitespace
        expect(is_valid_URL("  example.com")).equals(false)
        expect(is_valid_URL("  example.com  ")).equals(false)
    })

    it("should handle empty strings", () => {
        expect(is_valid_URL("")).equals(false)
    })
})
