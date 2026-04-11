

export function InternalSimulateError()
{
    return <>
        <button onClick={() => { throw new Error('Simulated error. (Tests that error logging is working)') }}>
            Simulate error via thrown error
        </button>
        <button onClick={() => { console.error('Simulated error via console.error (Tests that error logging is working)') }}>
            Simulate error via console.error
        </button>
        <button onClick={() => { console.warn('Simulated warning via console.warn (Tests that warnings are logged)') }}>
            Simulate warn via console.warn
        </button>
    </>
}
