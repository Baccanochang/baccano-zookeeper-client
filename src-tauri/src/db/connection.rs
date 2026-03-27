use crate::error::{AppError, AppResult};
use crate::models::{ConnectionModel, ConnectionSummary};
use crate::crypto::{encrypt, decrypt, get_or_create_key};
use rusqlite::{Connection, params};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_data_dir: PathBuf) -> AppResult<Self> {
        if !app_data_dir.exists() {
            std::fs::create_dir_all(&app_data_dir)
                .map_err(|e| AppError::Internal(format!("Failed to create app data directory {:?}: {}", app_data_dir, e)))?;
        }
        
        let db_path = app_data_dir.join("baccano.db");
        let conn = Connection::open(&db_path)
            .map_err(|e| AppError::Internal(format!("Failed to open database {:?}: {}", db_path, e)))?;
        
        let db = Self {
            conn: Mutex::new(conn),
        };
        db.initialize()?;
        Ok(db)
    }

    fn initialize(&self) -> AppResult<()> {
        let conn = self.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
        
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS connections (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                hosts TEXT NOT NULL,
                session_timeout_ms INTEGER NOT NULL DEFAULT 30000,
                connection_timeout_ms INTEGER NOT NULL DEFAULT 10000,
                auth_scheme TEXT,
                auth_credential TEXT,
                use_ssl INTEGER NOT NULL DEFAULT 0,
                ssl_ca_path TEXT,
                ssl_cert_path TEXT,
                ssl_key_path TEXT,
                readonly INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_connections_name ON connections(name);
            "#,
        )?;
        
        Ok(())
    }

    pub fn save_connection(&self, conn: &ConnectionModel) -> AppResult<()> {
        let db = self.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;

        // Encrypt credential if present
        let encrypted_credential = if let Some(ref cred) = conn.auth_credential {
            if !cred.is_empty() {
                let key = get_or_create_key()?;
                Some(encrypt(cred, &key)?)
            } else {
                None
            }
        } else {
            None
        };

        db.execute(
            r#"
            INSERT INTO connections (
                id, name, hosts, session_timeout_ms, connection_timeout_ms,
                auth_scheme, auth_credential, use_ssl, ssl_ca_path, ssl_cert_path,
                ssl_key_path, readonly, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                hosts = excluded.hosts,
                session_timeout_ms = excluded.session_timeout_ms,
                connection_timeout_ms = excluded.connection_timeout_ms,
                auth_scheme = excluded.auth_scheme,
                auth_credential = excluded.auth_credential,
                use_ssl = excluded.use_ssl,
                ssl_ca_path = excluded.ssl_ca_path,
                ssl_cert_path = excluded.ssl_cert_path,
                ssl_key_path = excluded.ssl_key_path,
                readonly = excluded.readonly,
                updated_at = excluded.updated_at
            "#,
            params![
                conn.id,
                conn.name,
                conn.hosts,
                conn.session_timeout_ms,
                conn.connection_timeout_ms,
                conn.auth_scheme,
                encrypted_credential,
                conn.use_ssl as i32,
                conn.ssl_ca_path,
                conn.ssl_cert_path,
                conn.ssl_key_path,
                conn.readonly as i32,
                conn.created_at.to_rfc3339(),
                conn.updated_at.to_rfc3339(),
            ],
        )?;

        Ok(())
    }

    pub fn list_connections(&self) -> AppResult<Vec<ConnectionModel>> {
        let db = self.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
        let key = get_or_create_key().ok(); // Don't fail if key is not available

        let mut stmt = db.prepare(
            r#"
            SELECT id, name, hosts, session_timeout_ms, connection_timeout_ms,
                   auth_scheme, auth_credential, use_ssl, ssl_ca_path, ssl_cert_path,
                   ssl_key_path, readonly, created_at, updated_at
            FROM connections
            ORDER BY name ASC
            "#,
        )?;

        let connections = stmt.query_map([], |row| {
            let encrypted_cred: Option<String> = row.get(6)?;
            let decrypted_cred = if let (Some(ref cred), Some(ref key)) = (&encrypted_cred, &key) {
                if !cred.is_empty() {
                    decrypt(cred, key).ok()
                } else {
                    None
                }
            } else {
                encrypted_cred
            };

            Ok(ConnectionModel {
                id: row.get(0)?,
                name: row.get(1)?,
                hosts: row.get(2)?,
                session_timeout_ms: row.get(3)?,
                connection_timeout_ms: row.get(4)?,
                auth_scheme: row.get(5)?,
                auth_credential: decrypted_cred,
                use_ssl: row.get::<_, i32>(7)? != 0,
                ssl_ca_path: row.get(8)?,
                ssl_cert_path: row.get(9)?,
                ssl_key_path: row.get(10)?,
                readonly: row.get::<_, i32>(11)? != 0,
                created_at: row.get::<_, String>(12)?.parse().unwrap_or_else(|_| chrono::Utc::now()),
                updated_at: row.get::<_, String>(13)?.parse().unwrap_or_else(|_| chrono::Utc::now()),
            })
        })?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| AppError::Internal(e.to_string()))?;

        Ok(connections)
    }

    pub fn get_connection(&self, id: &str) -> AppResult<Option<ConnectionModel>> {
        let db = self.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
        let key = get_or_create_key().ok();

        let mut stmt = db.prepare(
            r#"
            SELECT id, name, hosts, session_timeout_ms, connection_timeout_ms,
                   auth_scheme, auth_credential, use_ssl, ssl_ca_path, ssl_cert_path,
                   ssl_key_path, readonly, created_at, updated_at
            FROM connections
            WHERE id = ?1
            "#,
        )?;

        let result = stmt.query_row(params![id], |row| {
            let encrypted_cred: Option<String> = row.get(6)?;
            let decrypted_cred = if let (Some(ref cred), Some(ref key)) = (&encrypted_cred, &key) {
                if !cred.is_empty() {
                    decrypt(cred, key).ok()
                } else {
                    None
                }
            } else {
                encrypted_cred
            };

            Ok(ConnectionModel {
                id: row.get(0)?,
                name: row.get(1)?,
                hosts: row.get(2)?,
                session_timeout_ms: row.get(3)?,
                connection_timeout_ms: row.get(4)?,
                auth_scheme: row.get(5)?,
                auth_credential: decrypted_cred,
                use_ssl: row.get::<_, i32>(7)? != 0,
                ssl_ca_path: row.get(8)?,
                ssl_cert_path: row.get(9)?,
                ssl_key_path: row.get(10)?,
                readonly: row.get::<_, i32>(11)? != 0,
                created_at: row.get::<_, String>(12)?.parse().unwrap_or_else(|_| chrono::Utc::now()),
                updated_at: row.get::<_, String>(13)?.parse().unwrap_or_else(|_| chrono::Utc::now()),
            })
        });

        match result {
            Ok(conn) => Ok(Some(conn)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(AppError::Internal(e.to_string())),
        }
    }

    pub fn delete_connection(&self, id: &str) -> AppResult<()> {
        let db = self.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
        
        db.execute("DELETE FROM connections WHERE id = ?1", params![id])?;
        
        Ok(())
    }

    pub fn list_connection_summaries(&self) -> AppResult<Vec<ConnectionSummary>> {
        let db = self.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
        
        let mut stmt = db.prepare(
            "SELECT id, name, hosts FROM connections ORDER BY name ASC",
        )?;
        
        let summaries = stmt.query_map([], |row| {
            Ok(ConnectionSummary {
                id: row.get(0)?,
                name: row.get(1)?,
                hosts: row.get(2)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| AppError::Internal(e.to_string()))?;
        
        Ok(summaries)
    }
}
