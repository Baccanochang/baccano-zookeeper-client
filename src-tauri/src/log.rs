//! 日志模块 - 支持敏感信息脱敏

/// 敏感信息关键词
const SENSITIVE_KEYWORDS: &[&str] = &[
    "password",
    "credential",
    "secret",
    "token",
    "key",
    "auth",
];

/// 脱敏敏感值
fn mask_sensitive_value(value: &str) -> String {
    if value.is_empty() {
        return String::new();
    }
    if value.len() <= 4 {
        return "*".repeat(value.len());
    }
    format!("{}****", &value[..2])
}

/// 脱敏日志内容
pub fn sanitize_log_message(msg: &str) -> String {
    let mut result = msg.to_string();

    // 简单的键值对脱敏
    for keyword in SENSITIVE_KEYWORDS {
        // 匹配 "keyword": "value" 或 "keyword": value 格式
        let patterns = [
            format!(r#""{}":\s*"([^"]*)""#, keyword),
            format!(r#""{}":\s*([^,\}}]*)"#, keyword),
            format!("{}=([^\\s,]*)", keyword),
        ];

        for pattern in &patterns {
            if let Ok(re) = regex::Regex::new(&pattern) {
                result = re.replace_all(&result, |caps: &regex::Captures| {
                    let value = &caps[1];
                    let masked = mask_sensitive_value(value);
                    format!(r#""{}": "{}""#, keyword, masked)
                }).to_string();
            }
        }
    }

    result
}

/// 安全日志宏
#[macro_export]
macro_rules! safe_log {
    ($level:ident, $($arg:tt)*) => {
        let msg = format!($($arg)*);
        let sanitized = crate::log::sanitize_log_message(&msg);
        log::$level!("{}", sanitized);
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_password() {
        let msg = r#"{"password": "secret123"}"#;
        let sanitized = sanitize_log_message(msg);
        assert!(!sanitized.contains("secret123"));
        assert!(sanitized.contains("****"));
    }

    #[test]
    fn test_sanitize_credential() {
        let msg = r#"credential=mysecretvalue"#;
        let sanitized = sanitize_log_message(msg);
        assert!(!sanitized.contains("mysecretvalue"));
    }

    #[test]
    fn test_no_sanitize_normal() {
        let msg = r#"{"name": "test", "hosts": "localhost:2181"}"#;
        let sanitized = sanitize_log_message(msg);
        assert!(sanitized.contains("test"));
        assert!(sanitized.contains("localhost:2181"));
    }
}