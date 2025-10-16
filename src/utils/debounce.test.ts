import { expect } from "chai"
import { debounce } from "./debounce"


describe("debounce", () =>
{
    it("debounces calls correctly", (done) =>
    {
        let call_count = 0
        const debounced_fn = debounce((arg: number) =>
        {
            call_count++
            if (call_count === 1)
            {
                expect(arg).equals(4)
            }
            else if (call_count === 2)
            {
                expect(arg).equals(5)
                done()
            }
            else
            {
                throw new Error("Function called too many times")
            }
        }, 10)

        debounced_fn(1)
        setTimeout(() => debounced_fn(2), 0)
        setTimeout(() => debounced_fn(3), 0)
        setTimeout(() => debounced_fn(4), 0)
        setTimeout(() => debounced_fn(5), 20)
    })

    it("can commit calls when requested", (done) =>
    {
        let call_count = 0
        const debounced_fn = debounce((arg: number) =>
        {
            call_count++
            if (call_count === 1)
            {
                expect(arg).equals(2)
            }
            else if (call_count === 2)
            {
                expect(arg).equals(3)
                done()
            }
            else
            {
                throw new Error("Function called too many times")
            }
        }, 10)

        debounced_fn(1)
        setTimeout(() => debounced_fn(2), 0)
        setTimeout(() => debounced_fn.commit(), 0)
        setTimeout(() => debounced_fn(3), 20)
    })
})
