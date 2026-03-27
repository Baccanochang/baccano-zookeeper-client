pub mod commands;
pub mod db;
pub mod error;
pub mod models;
pub mod zk;

use db::Database;
use std::sync::Arc;
use tauri::Manager;
use zk::ConnectionManager;

pub struct AppState {
    pub db: Arc<Database>,
    pub zk: Arc<ConnectionManager>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = match app.path().app_data_dir() {
                Ok(path) => path,
                Err(_) => {
                    std::env::current_dir()
                        .unwrap_or_else(|_| std::path::PathBuf::from("."))
                        .join("data")
                }
            };
            
            let db = match Database::new(app_data_dir) {
                Ok(db) => db,
                Err(e) => {
                    let fallback_dir = std::env::current_dir()
                        .unwrap_or_else(|_| std::path::PathBuf::from("."))
                        .join("data");
                    Database::new(fallback_dir)
                        .expect(&format!("Failed to initialize database: {}", e))
                }
            };
            
            let zk = ConnectionManager::new();
            
            app.manage(Arc::new(AppState { 
                db: Arc::new(db),
                zk: Arc::new(zk),
            }));
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::get_app_info,
            commands::save_connection,
            commands::update_connection,
            commands::delete_connection,
            commands::list_connections,
            commands::get_connection,
            commands::list_connection_summaries,
            commands::test_connection,
            commands::connect_zk,
            commands::disconnect_zk,
            commands::get_children,
            commands::get_data,
            commands::set_data,
            commands::create_node,
            commands::delete_node,
            commands::exists,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
