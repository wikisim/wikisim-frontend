

export const local_storage = {
    get_account_email_address: () => localStorage.getItem("email_address") || "",
    set_account_email_address: (email: string) => localStorage.setItem("email_address", email),

    get_search_filter_by_user_id: () => localStorage.getItem("search_filter_by_user_id") || "",
    set_search_filter_by_user_id: (user_id: string) => localStorage.setItem("search_filter_by_user_id", user_id),

    get_show_option_for_code_editor: () => localStorage.getItem("settings.show_option_for_code_editor") === "true",
    set_show_option_for_code_editor: (show: boolean) => localStorage.setItem("settings.show_option_for_code_editor", show ? "true" : "false"),

    get_preferred_editor_ruler_columns: () =>
    {
        return localStorage.getItem("preferred_editor_ruler_columns")?.split(",").map(s => parseInt(s)).filter(n => !isNaN(n)) ?? []
    }
}
