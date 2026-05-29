pub mod file;
pub mod settings;

use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    pub code: String,
    pub message: String,
}

impl CommandError {
    pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
        }
    }
}

impl From<std::io::Error> for CommandError {
    fn from(error: std::io::Error) -> Self {
        use std::io::ErrorKind;

        match error.kind() {
            ErrorKind::NotFound => CommandError::new("FileNotFound", "File not found"),
            ErrorKind::PermissionDenied => CommandError::new("PermissionDenied", "Permission denied"),
            _ => CommandError::new("Io", error.to_string()),
        }
    }
}

pub type CommandResult<T> = Result<T, CommandError>;
