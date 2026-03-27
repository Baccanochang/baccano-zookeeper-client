use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use parking_lot::Mutex;
use crate::error::{AppError, AppResult};
use crate::models::ConnectionModel;
use zookeeper_client::{Client, CreateMode, Acls, Stat, SessionState};

pub struct ZkClient {
    connection_id: String,
    hosts: String,
    client: Mutex<Option<Client>>,
    connected: Mutex<bool>,
}

impl ZkClient {
    pub fn new(connection: &ConnectionModel) -> AppResult<Self> {
        Ok(Self {
            connection_id: connection.id.clone(),
            hosts: connection.hosts.clone(),
            client: Mutex::new(None),
            connected: Mutex::new(false),
        })
    }

    pub fn connection_id(&self) -> &str {
        &self.connection_id
    }

    pub fn state(&self) -> i32 {
        if *self.connected.lock() { 3 } else { 1 }
    }

    pub fn is_connected(&self) -> bool {
        *self.connected.lock()
    }

    pub async fn connect_async(&self, timeout_ms: u64) -> AppResult<()> {
        let hosts = self.hosts.clone();
        let timeout = Duration::from_millis(timeout_ms);

        // 使用 Connector 设置超时
        let connector = Client::connector()
            .with_session_timeout(timeout)
            .with_connection_timeout(timeout);

        // 连接 ZooKeeper
        let client = connector.connect(&hosts).await
            .map_err(|e| AppError::Connection(format!("Failed to connect: {}", e)))?;

        // 检查会话状态
        let state = client.state();
        if state == SessionState::SyncConnected || state == SessionState::ConnectedReadOnly {
            *self.client.lock() = Some(client);
            *self.connected.lock() = true;
            Ok(())
        } else {
            Err(AppError::Connection(format!("Connection failed, state: {:?}", state)))
        }
    }

    pub async fn get_children_async(&self, path: &str) -> AppResult<Vec<String>> {
        if !self.is_connected() {
            return Err(AppError::Connection("Not connected".to_string()));
        }

        let zk = {
            let client_guard = self.client.lock();
            client_guard.as_ref()
                .ok_or_else(|| AppError::Connection("Not connected".to_string()))?
                .clone()
        };

        let children = zk.list_children(path).await
            .map_err(|e| AppError::Connection(format!("Failed to get children: {}", e)))?;
        Ok(children)
    }

    pub async fn get_data_async(&self, path: &str) -> AppResult<(Vec<u8>, NodeStat)> {
        if !self.is_connected() {
            return Err(AppError::Connection("Not connected".to_string()));
        }

        let zk = {
            let client_guard = self.client.lock();
            client_guard.as_ref()
                .ok_or_else(|| AppError::Connection("Not connected".to_string()))?
                .clone()
        };

        let (data, stat) = zk.get_data(path).await
            .map_err(|e| AppError::Connection(format!("Failed to get data: {}", e)))?;
        Ok((data, stat.into()))
    }

    pub async fn set_data_async(&self, path: &str, data: &[u8], version: i32) -> AppResult<NodeStat> {
        if !self.is_connected() {
            return Err(AppError::Connection("Not connected".to_string()));
        }

        let zk = {
            let client_guard = self.client.lock();
            client_guard.as_ref()
                .ok_or_else(|| AppError::Connection("Not connected".to_string()))?
                .clone()
        };

        let stat = zk.set_data(path, data, Some(version)).await
            .map_err(|e| AppError::Connection(format!("Failed to set data: {}", e)))?;
        Ok(stat.into())
    }

    pub async fn create_async(&self, path: &str, data: &[u8], ephemeral: bool, sequential: bool) -> AppResult<String> {
        if !self.is_connected() {
            return Err(AppError::Connection("Not connected".to_string()));
        }

        let zk = {
            let client_guard = self.client.lock();
            client_guard.as_ref()
                .ok_or_else(|| AppError::Connection("Not connected".to_string()))?
                .clone()
        };

        let mode = match (ephemeral, sequential) {
            (true, true) => CreateMode::EphemeralSequential,
            (true, false) => CreateMode::Ephemeral,
            (false, true) => CreateMode::PersistentSequential,
            (false, false) => CreateMode::Persistent,
        };

        let options = mode.with_acls(Acls::anyone_all());
        let (_stat, sequence) = zk.create(path, data, &options).await
            .map_err(|e| AppError::Connection(format!("Failed to create node: {}", e)))?;

        if sequential {
            Ok(format!("{}{}", path, sequence))
        } else {
            Ok(path.to_string())
        }
    }

    pub async fn delete_async(&self, path: &str, version: i32) -> AppResult<()> {
        if !self.is_connected() {
            return Err(AppError::Connection("Not connected".to_string()));
        }

        let zk = {
            let client_guard = self.client.lock();
            client_guard.as_ref()
                .ok_or_else(|| AppError::Connection("Not connected".to_string()))?
                .clone()
        };

        zk.delete(path, Some(version)).await
            .map_err(|e| AppError::Connection(format!("Failed to delete node: {}", e)))?;
        Ok(())
    }

    pub async fn exists_async(&self, path: &str) -> AppResult<bool> {
        if !self.is_connected() {
            return Err(AppError::Connection("Not connected".to_string()));
        }

        let zk = {
            let client_guard = self.client.lock();
            client_guard.as_ref()
                .ok_or_else(|| AppError::Connection("Not connected".to_string()))?
                .clone()
        };

        let stat = zk.check_stat(path).await
            .map_err(|e| AppError::Connection(format!("Failed to check existence: {}", e)))?;
        Ok(stat.is_some())
    }

    pub fn close(&self) {
        *self.client.lock() = None;
        *self.connected.lock() = false;
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

impl From<Stat> for NodeStat {
    fn from(stat: Stat) -> Self {
        NodeStat {
            czxid: stat.czxid,
            mzxid: stat.mzxid,
            ctime: stat.ctime,
            mtime: stat.mtime,
            version: stat.version,
            cversion: stat.cversion,
            aversion: stat.aversion,
            ephemeral_owner: stat.ephemeral_owner,
            data_length: stat.data_length,
            num_children: stat.num_children,
            pzxid: stat.pzxid,
        }
    }
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

    pub async fn connect(&self, connection: &ConnectionModel) -> AppResult<Arc<ZkClient>> {
        // 先检查是否已有连接
        {
            let connections = self.connections.lock();
            if let Some(client) = connections.get(&connection.id) {
                if client.is_connected() {
                    return Ok(client.clone());
                }
            }
        }

        // 创建新连接
        let client = Arc::new(ZkClient::new(connection)?);
        client.connect_async(connection.connection_timeout_ms as u64).await?;

        // 存储连接
        let mut connections = self.connections.lock();
        connections.insert(connection.id.clone(), client.clone());
        Ok(client)
    }

    pub fn disconnect(&self, connection_id: &str) -> AppResult<()> {
        let mut connections = self.connections.lock();

        if let Some(client) = connections.remove(connection_id) {
            drop(connections);
            client.close();
        }

        Ok(())
    }

    pub fn get(&self, connection_id: &str) -> Option<Arc<ZkClient>> {
        let connections = self.connections.lock();
        connections.get(connection_id).cloned()
    }
}

impl Default for ConnectionManager {
    fn default() -> Self {
        Self::new()
    }
}