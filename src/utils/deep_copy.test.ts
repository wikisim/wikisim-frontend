import { expect } from "chai"

import { deep_copy } from "./deep_copy"


describe("deep_copy", () =>
{
    it("handles null", () =>
    {
        const b = deep_copy(null)
        expect(b).equals(null)
    })

    it("prevent self recursion", () =>
    {
        const a = { val: 1 }
        // @ts-ignore
        a.self = a

        const b = deep_copy(a)
        expect(b).equals(a)
    })
})
