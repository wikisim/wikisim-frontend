import { expect } from "chai"

import { sanitise_user_id_or_name } from "./sanitise_user_id_or_name"


describe("sanitise_user_id_or_name", function()
{
    it("should return the same UUID v4", function()
    {
        const id = "123e4567-e89b-42d3-a456-426614174000"
        expect(sanitise_user_id_or_name(id)).equals(id)
    })

    it("should trim and lowercase a user name", function()
    {
        const name = "  Kris  "
        expect(sanitise_user_id_or_name(name)).equals("kris")
    })

    it("should strip invalid characters from a user name", function()
    {
        const name = "  K@r!s#_$%^&*()  "
        expect(sanitise_user_id_or_name(name)).equals("krs_")
    })

    it("should return an empty string if the user name is all invalid characters", function()
    {
        const name = "  !@#$%^&*()  "
        expect(sanitise_user_id_or_name(name)).equals("")
    })

    it("allow space in Suarez Miranda", function()
    {
        const name = "  Suarez Mir and!!!!a  "
        expect(sanitise_user_id_or_name(name)).equals("suarez mir anda")
    })
})
