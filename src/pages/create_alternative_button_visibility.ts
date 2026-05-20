export function should_show_create_alternative_button(according_to_id: number): boolean
{
    return Number.isInteger(according_to_id) && according_to_id > 0
}
