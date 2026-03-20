
// Ignore CSS imports in tests
require.extensions[".css"] = function () { return null }

// Ignore SVG imports in tests
require.extensions[".svg"] = function () { return null }
