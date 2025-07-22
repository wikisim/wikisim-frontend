

// Utility to recursively copy an object
export function deep_copy<T>(obj: T): T
{
    // @ts-ignore
    const new_obj: T = Array.isArray(obj) ? [...obj] : obj ? {...obj}: obj

    if (new_obj && typeof new_obj === "object")
    {
        Object.getOwnPropertyNames(new_obj)
        .forEach(function (prop)
        {
            // @ts-ignore
            if (new_obj[prop] && typeof new_obj[prop] === "object")
            {
                // @ts-ignore
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                new_obj[prop] = deep_copy(new_obj[prop])
            }
        })
    }
    return new_obj
}
