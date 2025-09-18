

export function is_uuid_v4(str: string): boolean
{
    const uuid_v4_regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuid_v4_regex.test(str.toLowerCase())
}
