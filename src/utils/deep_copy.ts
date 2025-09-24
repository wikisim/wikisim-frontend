

// Utility to recursively copy an object with proper handling of built-in types
// and circular references
export function deep_copy<T>(obj: T, visited: WeakMap<object, any> = new WeakMap()): T
{
    // Handle primitives and null/undefined
    if (obj === null || typeof obj !== "object")
    {
        return obj
    }

    // Handle circular references
    if (visited.has(obj as object))
    {
        return visited.get(obj as object) as T
    }

    // Handle Date objects
    if (obj instanceof Date)
    {
        const copy = new Date(obj.getTime()) as T
        visited.set(obj as object, copy)
        return copy
    }

    // Handle RegExp objects
    if (obj instanceof RegExp)
    {
        const copy = new RegExp(obj.source, obj.flags) as T
        visited.set(obj as object, copy)
        return copy
    }

    // Handle Map objects
    if (obj instanceof Map)
    {
        const copy = new Map() as T
        visited.set(obj as object, copy)
        ;(obj as Map<any, any>).forEach((value, key) =>
        {
            ;(copy as Map<any, any>).set(deep_copy(key, visited), deep_copy(value, visited))
        })
        return copy
    }

    // Handle Set objects
    if (obj instanceof Set)
    {
        const copy = new Set() as T
        visited.set(obj as object, copy)
        ;(obj as Set<any>).forEach(value =>
        {
            ;(copy as Set<any>).add(deep_copy(value, visited))
        })
        return copy
    }

    // Handle typed arrays
    if (obj instanceof ArrayBuffer)
    {
        const copy = obj.slice(0) as T
        visited.set(obj as object, copy)
        return copy
    }

    // // Handle other typed arrays (Uint8Array, Int32Array, etc.)
    // if (ArrayBuffer.isView(obj))
    // {
    //     const constructor = (obj as any).constructor
    //     const copy = new constructor(obj) as T
    //     visited.set(obj as object, copy)
    //     return copy
    // }

    // Handle Error objects
    if (obj instanceof Error)
    {
        const copy = new (obj.constructor as ErrorConstructor)(obj.message) as T
        visited.set(obj as object, copy)
        ;(copy as Error).name = obj.name
        ;(copy as Error).stack = obj.stack
        return copy
    }

    // Handle Arrays
    if (Array.isArray(obj))
    {
        const copy: any[] = []
        visited.set(obj as object, copy as T)

        for (let i = 0; i < obj.length; i++)
        {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            copy[i] = deep_copy(obj[i], visited)
        }

        return copy as T
    }

    // Handle plain objects and class instances
    if (typeof obj === "object")
    {
        // For class instances, just return them as is

        // const proto = Object.getPrototypeOf(obj)
        // const copy = proto === Object.prototype
        //     ?
        // {} as T
        //     : Object.create(proto) as T

        // visited.set(obj as object, copy)

        // // Copy all enumerable and non-enumerable own properties
        // const descriptors = Object.getOwnPropertyDescriptors(obj)

        // for (const [key, descriptor] of Object.entries(descriptors))
        // {
        //     if (descriptor.value !== undefined)
        //     {
        //         // For data properties, deep copy the value
        //         Object.defineProperty(copy, key,
        //         {
        //             ...descriptor,
        //             value: deep_copy(descriptor.value, visited)
        //         })
        //     } else
        //     {
        //         // For accessor properties, copy as-is (getters/setters)
        //         Object.defineProperty(copy, key, descriptor)
        //     }
        // }

        return obj
    }

    // Fallback for any other cases
    return obj
}
