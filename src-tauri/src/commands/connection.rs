use crate::error::AppResult;
use crate::models::{ConnectionModel, ConnectionSummary};
use crate::zk::ZkClient;
use crate::AppState;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use tauri::State;

#[tauri::command]
pub async fn save_connection(
    state: State<'_, Arc<AppState>>,
    connection: ConnectionModel,
) -> AppResult<()> {
    state.db.save_connection(&connection)
}

#[tauri::command]
pub async fn update_connection(
    state: State<'_, Arc<AppState>>,
    mut connection: ConnectionModel,
) -> AppResult<()> {
    connection.updated_at = Utc::now();
    state.db.save_connection(&connection)
}

#[tauri::command]
pub async fn delete_connection(
    state: State<'_, Arc<AppState>>,
    id: String,
) -> AppResult<()> {
    let _ = state.zk.disconnect(&id);
    state.db.delete_connection(&id)
}

#[tauri::command]
pub async fn list_connections(
    state: State<'_, Arc<AppState>>,
) -> AppResult<Vec<ConnectionModel>> {
    state.db.list_connections()
}

#[tauri::command]
pub async fn get_connection(
    state: State<'_, Arc<AppState>>,
    id: String,
) -> AppResult<Option<ConnectionModel>> {
    state.db.get_connection(&id)
}

#[tauri::command]
pub async fn list_connection_summaries(
    state: State<'_, Arc<AppState>>,
) -> AppResult<Vec<ConnectionSummary>> {
    state.db.list_connection_summaries()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestConnectionResult {
    pub success: bool,
    pub message: String,
    pub latency_ms: Option<u64>,
}

#[tauri::command]
pub async fn test_connection(
    _state: State<'_, Arc<AppState>>,
    connection: ConnectionModel,
) -> AppResult<TestConnectionResult> {
    let start = std::time::Instant::now();
    
    match ZkClient::new(&connection) {
        Ok(client) => {
            let timeout = Duration::from_millis(connection.connection_timeout_ms as u64);
            match client.wait_for_connection(timeout) {
                Ok(()) => {
                    let latency = start.elapsed().as_millis() as u64;
                    Ok(TestConnectionResult {
                        success: true,
                        message: format!("连接成功，延迟 {}ms", latency),
                        latency_ms: Some(latency),
                    })
                }
                Err(e) => Ok(TestConnectionResult {
                    success: false,
                    message: format!("连接失败: {}", e),
                    latency_ms: None,
                }),
            }
        }
        Err(e) => Ok(TestConnectionResult {
            success: false,
            message: format!("创建连接失败: {}", e),
            latency_ms: None,
        }),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectResult {
    pub success: bool,
    pub message: String,
}

#[tauri::command]
pub async fn connect_zk(
    state: State<'_, Arc<AppState>>,
    id: String,
) -> AppResult<ConnectResult> {
    let connection = state.db.get_connection(&id)?;
    
    match connection {
        Some(conn) => {
            match state.zk.connect(&conn) {
                Ok(_) => Ok(ConnectResult {
                    success: true,
                    message: format!("已连接到 {}", conn.name),
                }),
                Err(e) => Ok(ConnectResult {
                    success: false,
                    message: format!("连接失败: {}", e),
                }),
            }
        }
        None => Ok(ConnectResult {
            success: false,
            message: "连接配置不存在".to_string(),
        }),
    }
}

#[tauri::command]
pub async fn disconnect_zk(
    state: State<'_, Arc<AppState>>,
    id: String,
) -> AppResult<()> {
    state.zk.disconnect(&id)
}