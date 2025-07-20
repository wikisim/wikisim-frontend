import { PostgrestError } from "@supabase/supabase-js"

import { GetSupabase } from "core/supabase"
import { Database } from "core/supabase/interface"
import { clamp } from "core/utils/clamp"

import { User } from "./interface"


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
    ids: string[] = [],
    options: { page?: number, size?: number } = {},
): Promise<RequestUsersReturn>
{
    limit_ids(ids)

    const { from, to } = get_range_from_options(options)

    return get_supabase()
        .from("users")
        .select("*")
        .in("id", ids)
        .order("id", { ascending: true })
        .range(from, to)
        .then(({ data, error }) =>
        {
            if (error) return { data: null, error }
            const instances = data.map(d => convert_from_db_row(d))
            return { data: instances, error: null }
        })
}


function limit_ids(ids: string[])
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
