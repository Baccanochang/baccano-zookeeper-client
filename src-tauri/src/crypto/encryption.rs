use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use rand::Rng;
use sha2::{Digest, Sha256};

use crate::error::{AppError, AppResult};

/// Encrypts data using AES-256-GCM
pub fn encrypt(plaintext: &str, key: &[u8; 32]) -> AppResult<String> {
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| AppError::Internal(format!("Failed to create cipher: {}", e)))?;

    // Generate random nonce
    let nonce_bytes: [u8; 12] = rand::thread_rng().gen();
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| AppError::Internal(format!("Encryption failed: {}", e)))?;

    // Combine nonce + ciphertext and encode as base64
    let mut combined = nonce_bytes.to_vec();
    combined.extend(ciphertext);

    Ok(BASE64.encode(&combined))
}

/// Decrypts data using AES-256-GCM
pub fn decrypt(ciphertext: &str, key: &[u8; 32]) -> AppResult<String> {
    let combined = BASE64
        .decode(ciphertext)
        .map_err(|e| AppError::Internal(format!("Base64 decode failed: {}", e)))?;

    if combined.len() < 12 {
        return Err(AppError::Internal("Invalid ciphertext length".to_string()));
    }

    let (nonce_bytes, ciphertext_bytes) = combined.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);

    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| AppError::Internal(format!("Failed to create cipher: {}", e)))?;

    let plaintext = cipher
        .decrypt(nonce, ciphertext_bytes)
        .map_err(|e| AppError::Internal(format!("Decryption failed: {}", e)))?;

    String::from_utf8(plaintext).map_err(|e| AppError::Internal(format!("Invalid UTF-8: {}", e)))
}

/// Derives a 32-byte key from a password using SHA-256
pub fn derive_key(password: &str) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let result = hasher.finalize();
    result.into()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let key = derive_key("test_password");
        let plaintext = "Hello, World!";
        let encrypted = encrypt(plaintext, &key).unwrap();
        let decrypted = decrypt(&encrypted, &key).unwrap();
        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn test_different_nonces() {
        let key = derive_key("test_password");
        let plaintext = "Hello, World!";
        let encrypted1 = encrypt(plaintext, &key).unwrap();
        let encrypted2 = encrypt(plaintext, &key).unwrap();
        assert_ne!(encrypted1, encrypted2); // Different nonces should produce different ciphertext
    }
}