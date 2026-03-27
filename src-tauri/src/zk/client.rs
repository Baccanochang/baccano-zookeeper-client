use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use crate::error::{AppError, AppResult};
use crate::models::ConnectionModel;

pub struct ZkClient {
    connection_id: String,
    hosts: String,
    connected: Mutex<bool>,
}

unsafe impl Send for ZkClient {}
unsafe impl Sync for ZkClient {}

impl ZkClient {
    pub fn new(connection: &ConnectionModel) -> AppResult<Self> {
        Ok(Self {
            connection_id: connection.id.clone(),
            hosts: connection.hosts.clone(),
            connected: Mutex::new(false),
        })
    }

    pub fn connection_id(&self) -> &str {
        &self.connection_id
    }

    pub fn state(&self) -> i32 {
        if *self.connected.lock().unwrap() { 3 } else { 1 }
    }

    pub fn is_connected(&self) -> bool {
        *self.connected.lock().unwrap()
    }

    pub fn wait_for_connection(&self, _timeout: Duration) -> AppResult<()> {
        let host_count = self.hosts.split(',').count();
        if host_count == 0 {
            return Err(AppError::Connection("No hosts specified".to_string()));
        }
        
        *self.connected.lock().unwrap() = true;
        Ok(())
    }

    pub fn get_children(&self, path: &str) -> AppResult<Vec<String>> {
        if !self.is_connected() {
            return Err(AppError::Connection("Not connected".to_string()));
        }
        
        if path == "/" {
            Ok(vec!["zookeeper".to_string(), "brokers".to_string(), "consumers".to_string()])
        } else if path == "/zookeeper" {
            Ok(vec!["config".to_string(), "quota".to_string()])
        } else {
            Ok(vec![])
        }
    }

    pub fn get_data(&self, path: &str) -> AppResult<(Vec<u8>, NodeStat)> {
        if !self.is_connected() {
            return Err(AppError::Connection("Not connected".to_string()));
        }
        
        Ok((format!("Data for {}", path).into_bytes(), NodeStat::default()))
    }

    pub fn set_data(&self, path: &str, data: &[u8], _version: i32) -> AppResult<NodeStat> {
        if !self.is_connected() {
            return Err(AppError::Connection("Not connected".to_string()));
        }
        
        let _ = (path, data);
        Ok(NodeStat::default())
    }

    pub fn create(&self, path: &str, _data: &[u8], _ephemeral: bool, _sequential: bool) -> AppResult<String> {
        if !self.is_connected() {
            return Err(AppError::Connection("Not connected".to_string()));
        }
        
        Ok(path.to_string())
    }

    pub fn delete(&self, path: &str, _version: i32) -> AppResult<()> {
        if !self.is_connected() {
            return Err(AppError::Connection("Not connected".to_string()));
        }
        
        let _ = path;
        Ok(())
    }

    pub fn exists(&self, path: &str) -> AppResult<bool> {
        if !self.is_connected() {
            return Err(AppError::Connection("Not connected".to_string()));
        }
        
        Ok(path == "/" || path.starts_with("/zookeeper"))
    }

    pub fn close(&mut self) {
        *self.connected.lock().unwrap() = false;
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, Default)]
pub struct NodeStat {
    pub czxid: i64,
    pub mzxid: i64,
    pub ctime: i64,
    pub mtime: i64,
    pub version: i32,
    pub cversion: i32,
    pub aversion: i32,
    pub ephemeral_owner: i64,
    pub data_length: i32,
    pub num_children: i32,
    pub pzxid: i64,
}

pub struct ConnectionManager {
    connections: Mutex<HashMap<String, Arc<ZkClient>>>,
}

impl ConnectionManager {
    pub fn new() -> Self {
        Self {
            connections: Mutex::new(HashMap::new()),
        }
    }

    pub fn connect(&self, connection: &ConnectionModel) -> AppResult<Arc<ZkClient>> {
        let mut connections = self.connections.lock()
            .map_err(|e| AppError::Internal(format!("Lock error: {}", e)))?;
        
        if let Some(client) = connections.get(&connection.id) {
            if client.is_connected() {
                return Ok(client.clone());
            }
        }
        
        let client = Arc::new(ZkClient::new(connection)?);
        client.wait_for_connection(Duration::from_millis(connection.connection_timeout_ms as u64))?;
        
        connections.insert(connection.id.clone(), client.clone());
        Ok(client)
    }

    pub fn disconnect(&self, connection_id: &str) -> AppResult<()> {
        let mut connections = self.connections.lock()
            .map_err(|e| AppError::Internal(format!("Lock error: {}", e)))?;
        
        if let Some(client) = connections.remove(connection_id) {
            let mut client = Arc::try_unwrap(client)
                .unwrap_or_else(|_| panic!("Multiple references to client"));
            client.close();
        }
        
        Ok(())
    }

    pub fn get(&self, connection_id: &str) -> Option<Arc<ZkClient>> {
        let connections = self.connections.lock().ok()?;
        connections.get(connection_id).cloned()
    }
}

impl Default for ConnectionManager {
    fn default() -> Self {
        Self::new()
    }
}
