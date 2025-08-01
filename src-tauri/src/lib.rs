mod database;

use database::{
    auth::{AuthService, LoginRequest, LoginResponse, UserInfo},
    lines::{BulkCreateLinesRequest, CreateLineRequest, LinesService, UpdateLineRequest},
    models::CreateUser,
    products::{
        BulkCreateProductsRequest, CreateProductRequest, ProductsService, UpdateProductRequest,
    },
    Database,
};
use std::sync::Arc;
use tauri::State;
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

    auth_service.login(request).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_users(
    db_state: State<'_, DatabaseState>,
) -> Result<Vec<database::models::User>, String> {
    let db = db_state.lock().await;
    let auth_service = AuthService::new(db.pool.clone());

    auth_service
        .get_all_users()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn change_password(
    db_state: State<'_, DatabaseState>,
    user_id: String,
    current_password: String,
    new_password: String,
) -> Result<(), String> {
    let db = db_state.lock().await;
    let auth_service = AuthService::new(db.pool.clone());

    let user_uuid =
        uuid::Uuid::parse_str(&user_id).map_err(|e| format!("Invalid user ID: {}", e))?;

    auth_service
        .change_password(&user_uuid, &current_password, &new_password)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_user_role(
    db_state: State<'_, DatabaseState>,
    user_id: String,
    new_role: String,
) -> Result<(), String> {
    let db = db_state.lock().await;
    let auth_service = AuthService::new(db.pool.clone());

    let user_uuid =
        uuid::Uuid::parse_str(&user_id).map_err(|e| format!("Invalid user ID: {}", e))?;

    auth_service
        .update_user_role(&user_uuid, &new_role)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_user(
    db_state: State<'_, DatabaseState>,
    username: String,
    password: String,
    role: String,
) -> Result<UserInfo, String> {
    let db = db_state.lock().await;
    let auth_service = AuthService::new(db.pool.clone());

    let create_user = CreateUser {
        username,
        password,
        role,
    };

    auth_service
        .create_user(create_user)
        .await
        .map(|user| UserInfo {
            id: user.id,
            username: user.username,
            role: user.role,
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_username(
    db_state: State<'_, DatabaseState>,
    user_id: String,
    new_username: String,
) -> Result<(), String> {
    let db = db_state.lock().await;
    let auth_service = AuthService::new(db.pool.clone());

    let user_uuid =
        uuid::Uuid::parse_str(&user_id).map_err(|e| format!("Invalid user ID: {}", e))?;

    auth_service
        .update_username(&user_uuid, &new_username)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_user(db_state: State<'_, DatabaseState>, user_id: String) -> Result<(), String> {
    let db = db_state.lock().await;
    let auth_service = AuthService::new(db.pool.clone());

    let user_uuid =
        uuid::Uuid::parse_str(&user_id).map_err(|e| format!("Invalid user ID: {}", e))?;

    auth_service
        .delete_user(&user_uuid)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_user_password(
    db_state: State<'_, DatabaseState>,
    user_id: String,
    new_password: String,
) -> Result<(), String> {
    let db = db_state.lock().await;
    let auth_service = AuthService::new(db.pool.clone());

    let user_uuid =
        uuid::Uuid::parse_str(&user_id).map_err(|e| format!("Invalid user ID: {}", e))?;

    auth_service
        .update_user_password(&user_uuid, &new_password)
        .await
        .map_err(|e| e.to_string())
}

// Lines management commands
#[tauri::command]
async fn get_lines(
    db_state: State<'_, DatabaseState>,
) -> Result<Vec<database::models::ProductionLine>, String> {
    let db = db_state.lock().await;
    let lines_service = LinesService::new(db.pool.clone());

    lines_service
        .get_all_lines()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_line(
    db_state: State<'_, DatabaseState>,
    request: CreateLineRequest,
) -> Result<database::models::ProductionLine, String> {
    let db = db_state.lock().await;
    let lines_service = LinesService::new(db.pool.clone());

    lines_service
        .create_line(request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn bulk_create_lines(
    db_state: State<'_, DatabaseState>,
    request: BulkCreateLinesRequest,
) -> Result<Vec<database::models::ProductionLine>, String> {
    let db = db_state.lock().await;
    let lines_service = LinesService::new(db.pool.clone());

    lines_service
        .bulk_create_lines(request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_line(
    db_state: State<'_, DatabaseState>,
    request: UpdateLineRequest,
) -> Result<database::models::ProductionLine, String> {
    let db = db_state.lock().await;
    let lines_service = LinesService::new(db.pool.clone());

    lines_service
        .update_line(request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_line(db_state: State<'_, DatabaseState>, line_id: String) -> Result<bool, String> {
    let db = db_state.lock().await;
    let lines_service = LinesService::new(db.pool.clone());

    let uuid = uuid::Uuid::parse_str(&line_id).map_err(|e| format!("Invalid UUID: {}", e))?;

    lines_service
        .delete_line(&uuid)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_multiple_lines(
    db_state: State<'_, DatabaseState>,
    line_ids: Vec<String>,
) -> Result<u64, String> {
    let db = db_state.lock().await;
    let lines_service = LinesService::new(db.pool.clone());

    let uuids: Result<Vec<uuid::Uuid>, _> = line_ids
        .iter()
        .map(|id| uuid::Uuid::parse_str(id))
        .collect();

    let uuids = uuids.map_err(|e| format!("Invalid UUID: {}", e))?;

    lines_service
        .delete_multiple_lines(uuids)
        .await
        .map_err(|e| e.to_string())
}

// Products management commands
#[tauri::command]
async fn get_products(
    db_state: State<'_, DatabaseState>,
) -> Result<Vec<database::models::Product>, String> {
    let db = db_state.lock().await;
    let products_service = ProductsService::new(db.pool.clone());

    products_service
        .get_all_products()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_product(
    db_state: State<'_, DatabaseState>,
    request: CreateProductRequest,
) -> Result<database::models::Product, String> {
    let db = db_state.lock().await;
    let products_service = ProductsService::new(db.pool.clone());

    products_service
        .create_product(request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn bulk_create_products(
    db_state: State<'_, DatabaseState>,
    request: BulkCreateProductsRequest,
) -> Result<Vec<database::models::Product>, String> {
    let db = db_state.lock().await;
    let products_service = ProductsService::new(db.pool.clone());

    products_service
        .bulk_create_products(request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_product(
    db_state: State<'_, DatabaseState>,
    request: UpdateProductRequest,
) -> Result<database::models::Product, String> {
    let db = db_state.lock().await;
    let products_service = ProductsService::new(db.pool.clone());

    products_service
        .update_product(request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_product(
    db_state: State<'_, DatabaseState>,
    product_id: String,
) -> Result<bool, String> {
    let db = db_state.lock().await;
    let products_service = ProductsService::new(db.pool.clone());

    let uuid = uuid::Uuid::parse_str(&product_id).map_err(|e| format!("Invalid UUID: {}", e))?;

    products_service
        .delete_product(&uuid)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_multiple_products(
    db_state: State<'_, DatabaseState>,
    product_ids: Vec<String>,
) -> Result<u64, String> {
    let db = db_state.lock().await;
    let products_service = ProductsService::new(db.pool.clone());

    let uuids: Result<Vec<uuid::Uuid>, _> = product_ids
        .iter()
        .map(|id| uuid::Uuid::parse_str(id))
        .collect();

    let uuids = uuids.map_err(|e| format!("Invalid UUID: {}", e))?;

    products_service
        .delete_multiple_products(uuids)
        .await
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Create a simple runtime for database initialization
    let rt = tokio::runtime::Runtime::new().expect("Failed to create runtime");
    let database = rt.block_on(async {
        Database::new()
            .await
            .expect("Failed to initialize database")
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
            get_users,
            // Lines management
            get_lines,
            create_line,
            bulk_create_lines,
            update_line,
            delete_line,
            delete_multiple_lines,
            // Products management
            get_products,
            create_product,
            bulk_create_products,
            update_product,
            delete_product,
            delete_multiple_products,
            // User management
            change_password,
            update_user_role,
            create_user,
            update_username,
            delete_user,
            update_user_password,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
