

export const local_storage = {
    get_account_email_address: () => localStorage.getItem("email_address") || "",
    set_account_email_address: (email: string) => localStorage.setItem("email_address", email),

    get_search_only_user_pages: (): boolean => (localStorage.getItem("search_only_user_pages") || "false") === "true",
    set_search_only_user_pages: (active: boolean) => localStorage.setItem("search_only_user_pages", active ? "true" : "false"),

    get_show_option_for_code_editor: () => localStorage.getItem("settings.show_option_for_code_editor") === "true",
    set_show_option_for_code_editor: (show: boolean) => localStorage.setItem("settings.show_option_for_code_editor", show ? "true" : "false"),

    get_preferred_editor_ruler_columns: () =>
    {
        return localStorage.getItem("preferred_editor_ruler_columns")?.split(",").map(s => parseInt(s)).filter(n => !isNaN(n)) ?? []
    },

    get_known_error_dismissed: (id: number): boolean =>
    {
        const key = `known_error_dismissed_${id}`
        const str = localStorage.getItem(key)
        return str === "true"
    },
    set_known_error_dismissed: (id: number) =>
    {
        const key = `known_error_dismissed_${id}`
        localStorage.setItem(key, "true")
    },
}
