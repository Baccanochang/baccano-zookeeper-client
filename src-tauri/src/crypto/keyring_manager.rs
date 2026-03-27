use base64::{Engine, engine::general_purpose::STANDARD as BASE64};
use keyring::Entry;
use rand::Rng;

use crate::error::{AppError, AppResult};

const SERVICE_NAME: &str = "baccano-zookeeper-client";
const KEY_NAME: &str = "encryption-key";

/// Generates a random 32-byte key encoded as base64
fn generate_key() -> String {
    let key_bytes: [u8; 32] = rand::thread_rng().gen();
    BASE64.encode(key_bytes)
}

/// Gets or creates the encryption key from system keyring
pub fn get_or_create_key() -> AppResult<[u8; 32]> {
    let entry = Entry::new(SERVICE_NAME, KEY_NAME)
        .map_err(|e| AppError::Internal(format!("Failed to access keyring: {}", e)))?;

    let key_str = match entry.get_password() {
        Ok(key) => key,
        Err(_) => {
            // Key doesn't exist, create a new one
            let new_key = generate_key();
            entry
                .set_password(&new_key)
                .map_err(|e| AppError::Internal(format!("Failed to store key: {}", e)))?;
            new_key
        }
    };

    // Decode base64 key to bytes
    let key_bytes = BASE64
        .decode(&key_str)
        .map_err(|e| AppError::Internal(format!("Invalid key format: {}", e)))?;

    let mut key_array = [0u8; 32];
    if key_bytes.len() != 32 {
        return Err(AppError::Internal("Invalid key length".to_string()));
    }
    key_array.copy_from_slice(&key_bytes);

    Ok(key_array)
}

/// Deletes the encryption key from system keyring
pub fn delete_key() -> AppResult<()> {
    let entry = Entry::new(SERVICE_NAME, KEY_NAME)
        .map_err(|e| AppError::Internal(format!("Failed to access keyring: {}", e)))?;

    entry
        .delete_credential()
        .map_err(|e| AppError::Internal(format!("Failed to delete key: {}", e)))?;

    Ok(())
}