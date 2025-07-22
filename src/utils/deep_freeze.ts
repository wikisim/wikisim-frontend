

// Utility to recursively freeze an object
export function deep_freeze<T>(obj: T): T
{
    if (obj && typeof obj === "object" && !Object.isFrozen(obj))
    {
        Object.getOwnPropertyNames(obj)
        .forEach(function (prop)
        {
            // @ts-ignore
            if (obj[prop] && typeof obj[prop] === "object")
            {
                // @ts-ignore
                deep_freeze(obj[prop])
            }
        })
        Object.freeze(obj)
    }
    return obj
}
