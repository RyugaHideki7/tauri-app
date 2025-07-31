mod database;

use database::{Database, auth::{AuthService, LoginRequest, LoginResponse}};
use tauri::State;
use std::sync::Arc;
use tokio::sync::Mutex;

type DatabaseState = Arc<Mutex<Database>>;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn minimize_window(window: tauri::Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
async fn maximize_window(window: tauri::Window) -> Result<(), String> {
    window.maximize().map_err(|e| e.to_string())
}

#[tauri::command]
async fn close_window(window: tauri::Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
async fn login(
    db_state: State<'_, DatabaseState>,
    request: LoginRequest,
) -> Result<LoginResponse, String> {
    let db = db_state.lock().await;
    let auth_service = AuthService::new(db.pool.clone());
    
    auth_service.login(request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_users(
    db_state: State<'_, DatabaseState>,
) -> Result<Vec<database::models::User>, String> {
    let db = db_state.lock().await;
    let auth_service = AuthService::new(db.pool.clone());
    
    auth_service.get_all_users()
        .await
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Create a simple runtime for database initialization
    let rt = tokio::runtime::Runtime::new().expect("Failed to create runtime");
    let database = rt.block_on(async {
        Database::new().await.expect("Failed to initialize database")
    });
    let db_state = Arc::new(Mutex::new(database));
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(db_state)
        .invoke_handler(tauri::generate_handler![
            greet, 
            minimize_window, 
            maximize_window, 
            close_window,
            login,
            get_users
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
