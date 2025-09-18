import { expect } from "chai"
import { is_uuid_v4 } from "./is_uuid_v4"


describe("is_uuid_v4", () =>
{
    it("valid UUID v4", () =>
    {
        expect(is_uuid_v4("123e4567-e89b-42d3-a456-426614174000")).equals(true)
        expect(is_uuid_v4("550E8400-E29B-41D4-A716-446655440000")).equals(true) // uppercase
    })
})
