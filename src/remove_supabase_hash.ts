

// When supabase auth is used, it will redirect to the page with a hash.
// This code removes the hash from the URL.
if (window.location.toString().endsWith("#"))
{
    history.replaceState(null, "", window.location.pathname + window.location.search)
}
