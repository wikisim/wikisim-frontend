import { is_uuid_v4 } from "../../utils/is_uuid_v4"


export function sanitise_user_id_or_name(user_id_or_name: string): string
{
    user_id_or_name = user_id_or_name.trim().toLowerCase()

    if (is_uuid_v4(user_id_or_name)) return user_id_or_name

    // Otherwise we want to strip all non-valid characters from the user name,
    // this also protects against SQL injection attacks
    user_id_or_name = user_id_or_name.replace(/[^a-z0-9_ ]/g, "").trim()

    return user_id_or_name
}
