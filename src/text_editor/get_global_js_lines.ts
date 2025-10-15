import { FunctionArgument } from "core/data/interface"
import { to_javascript_reference } from "core/data/to_javascript_reference"
import { deindent } from "core/utils/deindent"
import { truncate } from "core/utils/truncate"

import { DataComponentsById } from "../state/data_components/interface"


export function get_global_js_lines(data_component_dependencies_by_id: DataComponentsById, function_arguments: FunctionArgument[])
{
    const dependencies_and_aliases = Object.entries(data_component_dependencies_by_id)
    .map(([id, component]) =>
    {
        const description = truncate(component.plain_description.replaceAll("*/", "* /"), 200)
        return deindent(`
        /**
         * ${description}
         *
         * https://wikisim.org/wiki/${id}
         */
        declare var ${"d" + id}: any;
        /**
         * ${description}
         *
         * https://wikisim.org/wiki/${id}
         */
        declare var ${to_javascript_reference(component)}: any; // ${id}
        `)
    })

    const function_args_for_auto_complete = [
        `// function args for auto-complete`,
        ...Object.entries(function_arguments)
            .map(([_, arg]) => `declare var ${arg.name}: any;`)
    ]

    return [
        ...dependencies_and_aliases,
        ...function_args_for_auto_complete,
    ]
}
