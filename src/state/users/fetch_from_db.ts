import type { PostgrestError } from "@supabase/supabase-js"

import type { GetSupabase } from "core/supabase/browser"
import type { Database } from "core/supabase/interface"
import { clamp } from "core/utils/clamp"

import { is_uuid_v4 } from "../../utils/is_uuid_v4"
import type { User } from "./interface"
import { sanitise_user_id_or_name } from "./sanitise_user_id_or_name"


type UsersDBRow = Database["public"]["Tables"]["users"]["Row"]


export type RequestUsersReturn =
{
    data: User[]
    error: null
} | {
    data: null
    error: PostgrestError | Error
}
export async function request_users(
    get_supabase: GetSupabase,
    ids_or_names: string[] = [],
    options: { page?: number, size?: number } = {},
): Promise<RequestUsersReturn>
{
    limit_ids(ids_or_names)

    const { from, to } = get_range_from_options(options)

    const ids: string[] = []
    const names: string[] = []
    ids_or_names.forEach(id_or_name =>
    {
        // Sanitize the ID or name again just in case
        id_or_name = sanitise_user_id_or_name(id_or_name)

        if (is_uuid_v4(id_or_name)) ids.push(id_or_name)
        else names.push(id_or_name)
    })

    // Build the or filter string
    const filters = []
    if (ids.length > 0) filters.push(`id.in.(${ids.map(id => `"${id}"`).join(",")})`)
    if (names.length > 0) filters.push(`name.in.(${names.map(name => `"${name}"`).join(",")})`)
    const or_filter = filters.join(",")

    return get_supabase()
        .from("users")
        .select("*")
        .or(or_filter)
        .order("id", { ascending: true })
        .range(from, to)
        .then(({ data, error }) =>
        {
            if (error) return { data: null, error }
            const instances = data.map(d => convert_from_db_row(d))
            return { data: instances, error: null }
        })
}


function limit_ids<U>(ids: U[])
{
    if (ids.length > 1000)
    {
        throw new Error("Too many IDs provided, maximum is 1000")
    }
    if (ids.length === 0)
    {
        throw new Error("No user IDs provided for request")
    }
}


function get_range_from_options(options: { page?: number, size?: number } = {}): { from: number, to: number }
{
    let { page, size } = options
    page = Math.max(page ?? 0, 0)
    size = clamp(size ?? 20, 1, 1000)
    const limit = size
    const offset = page * limit
    const from = offset
    const to = offset + limit - 1
    return { from, to }
}


function convert_from_db_row(row: UsersDBRow): User
{
    return {
        id: row.id,
        name: row.name,
    }
}
