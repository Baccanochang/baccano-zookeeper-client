use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionModel {
    pub id: String,
    pub name: String,
    pub hosts: String,
    #[serde(rename = "sessionTimeoutMs")]
    pub session_timeout_ms: u32,
    #[serde(rename = "connectionTimeoutMs")]
    pub connection_timeout_ms: u32,
    #[serde(rename = "authScheme")]
    pub auth_scheme: Option<String>,
    #[serde(rename = "authCredential")]
    pub auth_credential: Option<String>,
    #[serde(rename = "useSsl")]
    pub use_ssl: bool,
    #[serde(rename = "sslCaPath")]
    pub ssl_ca_path: Option<String>,
    #[serde(rename = "sslCertPath")]
    pub ssl_cert_path: Option<String>,
    #[serde(rename = "sslKeyPath")]
    pub ssl_key_path: Option<String>,
    pub readonly: bool,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime<Utc>,
}

impl ConnectionModel {
    pub fn new(
        name: String,
        hosts: String,
        session_timeout_ms: u32,
        connection_timeout_ms: u32,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            hosts,
            session_timeout_ms,
            connection_timeout_ms,
            auth_scheme: None,
            auth_credential: None,
            use_ssl: false,
            ssl_ca_path: None,
            ssl_cert_path: None,
            ssl_key_path: None,
            readonly: false,
            created_at: now,
            updated_at: now,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionSummary {
    pub id: String,
    pub name: String,
    pub hosts: String,
}
