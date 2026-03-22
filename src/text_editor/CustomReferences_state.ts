import { RootAppState } from "../state/interface"


// CustomReferences needs to check if their component is the latest version,
// and if currently editing content
// This is a hacky solution.  Think of a better approach.
let shared_state: RootAppState | undefined = undefined
export function update_shared_app_state(new_state: RootAppState)
{
    shared_state = new_state
}

export function get_shared_app_state(): RootAppState | undefined
{
    return shared_state
}
