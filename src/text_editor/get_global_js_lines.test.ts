import { expect } from "chai"

import { init_data_component } from "core/data/modify"
import { deindent } from "core/utils/deindent"

import { DataComponentsById } from "../state/data_components/interface"
import {
    get_global_js_lines,
    upsert_js_component_const
} from "./get_global_js_lines"


describe("get_global_js_lines", () =>
{
    it("generates correct JS lines for components and function arguments", () =>
    {
        const components: DataComponentsById = {
            "12v3": init_data_component({
                id: "12v3",
                title: "Some normal title",
                plain_description: "Component 12 description",
            }),
            "45v6": init_data_component({
                id: "45v6",
                title: "  $u%6_(Some StRaNgE t-i-t-l-e)",
                plain_description: "Component 45 */ description",
            }),
        }

        const functionArgs = [
            { name: "arg1", id: 0 },
            { name: "arg2", id: 1 }
        ]

        const js_lines = get_global_js_lines(components, functionArgs, true).join("\n")

        // Check that component declarations are included
        expect(js_lines).equals(deindent(`
            /**
             * Component 12 description
             *
             * https://wikisim.org/wiki/12v3
             */
            declare var d12v3: any;
            /**
             * Component 45 * / description
             *
             * https://wikisim.org/wiki/45v6
             */
            declare var d45v6: any;
            /**
             * Component 12 description
             *
             * https://wikisim.org/wiki/12v3
             */
            declare var Some_normal_title: any; // 12v3
            /**
             * Component 45 * / description
             *
             * https://wikisim.org/wiki/45v6
             */
            declare var u_6_Some_StRaNgE_t_i_t_l_e: any; // 45v6
            // function args for auto-complete
            declare var arg1: any;
            declare var arg2: any;
        `))
    })
})


describe("upsert_js_component_const", () =>
{
    it("generates correct JS reference lines for components", () =>
    {
        const component = init_data_component({
            id: "12v3",
            title: "Some normal title",
            plain_description: "Component 12 description",
        })

        const initial_code = deindent(`
        Some_normal_title + 123 + Some_normal_title(456)
        `)

        const code = upsert_js_component_const(component, initial_code)
        expect(code).equals(deindent(`
            const Some_normal_title = d12v3
            Some_normal_title + 123 + Some_normal_title(456)
        `))

        const code2 = upsert_js_component_const(component, code)
        expect(code2).equals(deindent(`
            const Some_normal_title = d12v3
            Some_normal_title + 123 + Some_normal_title(456)
        `))
    })
})
