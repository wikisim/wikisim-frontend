// merge-deps.js
import * as fs from "fs"
import * as path from "path"

const top_level = JSON.parse(fs.readFileSync("./package.json"))
const core = JSON.parse(fs.readFileSync("./lib/core/package.json"))

function merge_deps(target, source)
{
    let target_copy = { ...target }
    for (const [dep, version] of Object.entries(source))
    {
        target[dep] = version
    }

    // Order dependencies by name
    const sorted_deps = Object.entries(target_copy).sort(([a], [b]) => a.localeCompare(b))
    const sorted_target = Object.fromEntries(sorted_deps)
    return sorted_target
}

top_level.dependencies = merge_deps(top_level.dependencies, core.dependencies)
top_level.devDependencies = merge_deps(top_level.devDependencies, core.devDependencies)

fs.writeFileSync(
    path.join("./package.json"),
    JSON.stringify(top_level, null, 4)
)

console.log("Merged dependencies")
