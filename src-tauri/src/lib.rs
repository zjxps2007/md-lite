mod commands;

use commands::{
    file::{get_file_stat, open_markdown_file, save_markdown_file, save_markdown_file_as},
    settings::{load_settings, save_settings},
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            open_markdown_file,
            save_markdown_file,
            save_markdown_file_as,
            get_file_stat,
            load_settings,
            save_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
