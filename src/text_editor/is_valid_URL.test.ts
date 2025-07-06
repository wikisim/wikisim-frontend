import { is_valid_URL } from "./is_valid_URL"


describe("is_valid_URL", () => {
    it("should return true for valid URLs", () => {
        expect(is_valid_URL("https://example.com")).toBe(true)
        expect(is_valid_URL("http://example.com")).toBe(true)
        expect(is_valid_URL("www.example.com")).toBe(true)
        expect(is_valid_URL("example.com")).toBe(true)
        expect(is_valid_URL("a.com")).toBe(true)
        expect(is_valid_URL("https://subdomain.example.com/path?query=123#fragment")).toBe(true)
        expect(is_valid_URL("subdomain.example.com/path?query=123#fragment")).toBe(true)
        // handles trailing whitespace
        expect(is_valid_URL("example.com  ")).toBe(true)
        // Seems to be handled as valid by URL constructor and browsers
        expect(is_valid_URL("http:/invalid.com")).toBe(true)
    })

    it("should return false for invalid URLs", () => {
        expect(is_valid_URL("invalid-url")).toBe(false)
        // rejects prepended whitespace
        expect(is_valid_URL("  example.com")).toBe(false)
        expect(is_valid_URL("  example.com  ")).toBe(false)
    })

    it("should handle empty strings", () => {
        expect(is_valid_URL("")).toBe(false)
    })
})
