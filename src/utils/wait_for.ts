
export async function wait_for(ms: number)
{
    return new Promise(resolve => setTimeout(resolve, ms))
}
