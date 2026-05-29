use serde_json::{json, Value};
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

use super::{file::write_text_atomic, CommandError, CommandResult};

fn settings_path(app: &AppHandle) -> CommandResult<PathBuf> {
    let directory = app
        .path()
        .app_config_dir()
        .map_err(|error| CommandError::new("InvalidPath", error.to_string()))?;

    fs::create_dir_all(&directory)?;
    Ok(directory.join("settings.json"))
}

#[tauri::command]
pub fn load_settings(app: AppHandle) -> CommandResult<Value> {
    let path = settings_path(&app)?;

    if !path.exists() {
        return Ok(json!({}));
    }

    let raw = fs::read_to_string(path)?;
    Ok(serde_json::from_str(&raw).unwrap_or_else(|_| json!({})))
}

#[tauri::command]
pub fn save_settings(app: AppHandle, settings: Value) -> CommandResult<()> {
    let path = settings_path(&app)?;
    let content = serde_json::to_string_pretty(&settings)
        .map_err(|error| CommandError::new("Unknown", error.to_string()))?;

    write_text_atomic(&path, &content)
}
