export function should_show_create_alternative_button(accordingToId: number): boolean
{
    return Number.isInteger(accordingToId) && accordingToId > 0
}
