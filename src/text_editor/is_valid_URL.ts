

// Helper function to check if a string is a valid URL
export function is_valid_URL(string: string): boolean
{
    try
    {
        new URL(string)
        return true
    }
    catch (_)
    {
        // Check for common URL patterns without protocol
        if (/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}/.test(string))
        {
            return true
        }
        return false
    }
}
