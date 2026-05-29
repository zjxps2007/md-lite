use serde::Serialize;
use std::{
    fs,
    io::Write,
    path::{Path, PathBuf},
    time::UNIX_EPOCH,
};

use super::{CommandError, CommandResult};

const MAX_OPEN_BYTES: u64 = 100 * 1024 * 1024;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileStat {
    size: u64,
    modified_at: u64,
    created_at: Option<u64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileOpenResult {
    path: String,
    file_name: String,
    content: String,
    line_ending: String,
    readonly: bool,
    file_stat: FileStat,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileSaveResult {
    path: String,
    file_name: String,
    file_stat: FileStat,
}

fn system_time_millis(time: std::io::Result<std::time::SystemTime>) -> Option<u64> {
    time.ok()
        .and_then(|value| value.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_millis() as u64)
}

fn file_name(path: &Path) -> String {
    path.file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_else(|| "Untitled.md".to_string())
}

fn stat_for_path(path: &Path) -> CommandResult<FileStat> {
    let metadata = fs::metadata(path)?;

    Ok(FileStat {
        size: metadata.len(),
        modified_at: system_time_millis(metadata.modified()).unwrap_or(0),
        created_at: system_time_millis(metadata.created()),
    })
}

fn normalize_for_editor(content: String) -> (String, String) {
    let line_ending = if content.contains("\r\n") { "crlf" } else { "lf" };
    let normalized = content.replace("\r\n", "\n").replace('\r', "\n");
    (normalized, line_ending.to_string())
}

fn content_for_disk(content: &str, line_ending: &str) -> String {
    let normalized = content.replace("\r\n", "\n").replace('\r', "\n");

    if line_ending == "crlf" {
        normalized.replace('\n', "\r\n")
    } else {
        normalized
    }
}

pub fn write_text_atomic(path: &Path, content: &str) -> CommandResult<()> {
    let tmp_path = path.with_extension("mdlite.tmp");
    let mut tmp = fs::File::create(&tmp_path)?;

    if let Err(error) = tmp.write_all(content.as_bytes()).and_then(|_| tmp.sync_all()) {
        let _ = fs::remove_file(&tmp_path);
        return Err(CommandError::from(error));
    }

    match fs::rename(&tmp_path, path) {
        Ok(_) => Ok(()),
        Err(first_error) => {
            if path.exists() {
                fs::remove_file(path)?;
                fs::rename(&tmp_path, path)?;
                Ok(())
            } else {
                let _ = fs::remove_file(&tmp_path);
                Err(CommandError::from(first_error))
            }
        }
    }
}

#[tauri::command(rename_all = "camelCase")]
pub fn open_markdown_file(path: Option<String>) -> CommandResult<Option<FileOpenResult>> {
    let selected_path = match path {
        Some(path) => PathBuf::from(path),
        None => match rfd::FileDialog::new()
            .add_filter("Markdown", &["md", "markdown", "mdown", "txt"])
            .pick_file()
        {
            Some(path) => path,
            None => return Ok(None),
        },
    };

    if !selected_path.exists() {
        return Err(CommandError::new("FileNotFound", "File not found"));
    }

    let file_stat = stat_for_path(&selected_path)?;
    if file_stat.size > MAX_OPEN_BYTES {
        return Err(CommandError::new(
            "FileTooLarge",
            "Files over 100MB are blocked by the MVP safety policy",
        ));
    }

    let bytes = fs::read(&selected_path)?;
    let content = String::from_utf8(bytes).map_err(|_| {
        CommandError::new(
            "UnsupportedEncoding",
            "Only UTF-8 Markdown files are supported",
        )
    })?;
    let (content, line_ending) = normalize_for_editor(content);
    let readonly = fs::metadata(&selected_path)?.permissions().readonly();

    Ok(Some(FileOpenResult {
        path: selected_path.to_string_lossy().to_string(),
        file_name: file_name(&selected_path),
        content,
        line_ending,
        readonly,
        file_stat,
    }))
}

#[tauri::command(rename_all = "camelCase")]
pub fn save_markdown_file(
    path: String,
    content: String,
    expected_modified_at: Option<u64>,
    line_ending: String,
) -> CommandResult<FileSaveResult> {
    let target = PathBuf::from(path);

    if let Some(parent) = target.parent() {
        if !parent.exists() {
            return Err(CommandError::new("InvalidPath", "Parent directory does not exist"));
        }
    }

    if target.exists() {
        let current_stat = stat_for_path(&target)?;
        if let Some(expected) = expected_modified_at {
            if current_stat.modified_at != expected {
                return Err(CommandError::new(
                    "ExternalModification",
                    "The file changed on disk after it was opened",
                ));
            }
        }
    }

    let disk_content = content_for_disk(&content, &line_ending);
    write_text_atomic(&target, &disk_content)?;
    let file_stat = stat_for_path(&target)?;

    Ok(FileSaveResult {
        path: target.to_string_lossy().to_string(),
        file_name: file_name(&target),
        file_stat,
    })
}

#[tauri::command(rename_all = "camelCase")]
pub fn save_markdown_file_as(content: String, line_ending: String) -> CommandResult<Option<FileSaveResult>> {
    let selected_path = match rfd::FileDialog::new()
        .add_filter("Markdown", &["md", "markdown"])
        .set_file_name("Untitled.md")
        .save_file()
    {
        Some(path) => path,
        None => return Ok(None),
    };

    let disk_content = content_for_disk(&content, &line_ending);
    write_text_atomic(&selected_path, &disk_content)?;
    let file_stat = stat_for_path(&selected_path)?;

    Ok(Some(FileSaveResult {
        path: selected_path.to_string_lossy().to_string(),
        file_name: file_name(&selected_path),
        file_stat,
    }))
}

#[tauri::command(rename_all = "camelCase")]
pub fn get_file_stat(path: String) -> CommandResult<FileStat> {
    stat_for_path(&PathBuf::from(path))
}
