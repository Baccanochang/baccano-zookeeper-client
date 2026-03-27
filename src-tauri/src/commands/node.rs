use crate::error::AppResult;
use crate::zk::NodeStat;
use crate::AppState;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeChildren {
    pub path: String,
    pub children: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeData {
    pub path: String,
    pub name: String,
    pub data: Option<String>,
    pub stat: NodeStat,
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_children(
    state: State<'_, Arc<AppState>>,
    connection_id: String,
    path: String,
) -> AppResult<NodeChildren> {
    let client = state.zk.get(&connection_id)
        .ok_or_else(|| crate::error::AppError::Connection("Not connected".to_string()))?;

    let children = client.get_children(&path)?;

    Ok(NodeChildren { path, children })
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_data(
    state: State<'_, Arc<AppState>>,
    connection_id: String,
    path: String,
) -> AppResult<NodeData> {
    let client = state.zk.get(&connection_id)
        .ok_or_else(|| crate::error::AppError::Connection("Not connected".to_string()))?;

    let (data, stat) = client.get_data(&path)?;
    let name = path.split('/').last().unwrap_or(&path).to_string();

    Ok(NodeData {
        path,
        name,
        data: Some(String::from_utf8_lossy(&data).to_string()),
        stat,
    })
}

#[tauri::command(rename_all = "camelCase")]
pub async fn set_data(
    state: State<'_, Arc<AppState>>,
    connection_id: String,
    path: String,
    data: String,
    version: i32,
) -> AppResult<NodeStat> {
    let client = state.zk.get(&connection_id)
        .ok_or_else(|| crate::error::AppError::Connection("Not connected".to_string()))?;

    client.set_data(&path, data.as_bytes(), version)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateNodeOptions {
    pub path: String,
    pub data: Option<String>,
    pub ephemeral: bool,
    pub sequential: bool,
}

#[tauri::command(rename_all = "camelCase")]
pub async fn create_node(
    state: State<'_, Arc<AppState>>,
    connection_id: String,
    options: CreateNodeOptions,
) -> AppResult<String> {
    let client = state.zk.get(&connection_id)
        .ok_or_else(|| crate::error::AppError::Connection("Not connected".to_string()))?;

    let data = options.data.unwrap_or_default();
    client.create(&options.path, data.as_bytes(), options.ephemeral, options.sequential)
}

#[tauri::command(rename_all = "camelCase")]
pub async fn delete_node(
    state: State<'_, Arc<AppState>>,
    connection_id: String,
    path: String,
    version: i32,
) -> AppResult<()> {
    let client = state.zk.get(&connection_id)
        .ok_or_else(|| crate::error::AppError::Connection("Not connected".to_string()))?;

    client.delete(&path, version)
}

#[tauri::command(rename_all = "camelCase")]
pub async fn exists(
    state: State<'_, Arc<AppState>>,
    connection_id: String,
    path: String,
) -> AppResult<bool> {
    let client = state.zk.get(&connection_id)
        .ok_or_else(|| crate::error::AppError::Connection("Not connected".to_string()))?;

    client.exists(&path)
}
