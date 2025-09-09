mod database;

use database::auth::{AuthService, LoginRequest, LoginResponse, UserInfo, PaginationParams as AuthPaginationParams, PaginatedResponse as AuthPaginatedResponse};
use database::models::{CreateUser, CreateClient, NcDes, Format, NonConformityReport};
use database::clients::{ClientsService, CreateClientRequest, BulkCreateClientsRequest, UpdateClientRequest, PaginationParams as ClientsPaginationParams, PaginatedResponse as ClientsPaginatedResponse};
use database::products::{ProductsService, CreateProductRequest, BulkCreateProductsRequest, UpdateProductRequest, PaginationParams as ProductsPaginationParams, PaginatedResponse as ProductsPaginatedResponse};
use database::lines::{LinesService, CreateLineRequest, BulkCreateLinesRequest, UpdateLineRequest, PaginationParams as LinesPaginationParams, PaginatedResponse as LinesPaginatedResponse};
use database::reports::{ReportsService, CreateReportRequest, UpdateReportRequest, PaginationParams as ReportsPaginationParams, PaginatedResponse as ReportsPaginatedResponse};
use database::{Database};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;
use uuid::Uuid;

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
async fn get_users_paginated(
    db_state: State<'_, DatabaseState>,
    page: i64,
    limit: i64,
    search: Option<String>,
) -> Result<AuthPaginatedResponse<database::models::User>, String> {
    let db = db_state.lock().await;
    let auth_service = AuthService::new(db.pool.clone());
    
    let params = AuthPaginationParams { page, limit, search };
    auth_service
        .get_paginated_users(params)
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
async fn get_lines_paginated(
    db_state: State<'_, DatabaseState>,
    page: i64,
    limit: i64,
    search: Option<String>,
) -> Result<LinesPaginatedResponse<database::models::ProductionLine>, String> {
    let db = db_state.lock().await;
    let lines_service = LinesService::new(db.pool.clone());
    
    let params = LinesPaginationParams { page, limit, search };
    lines_service
        .get_paginated_lines(params)
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
async fn get_products_paginated(
    db_state: State<'_, DatabaseState>,
    page: i64,
    limit: i64,
    search: Option<String>,
) -> Result<ProductsPaginatedResponse<database::models::Product>, String> {
    let db = db_state.lock().await;
    let products_service = ProductsService::new(db.pool.clone());
    
    let params = ProductsPaginationParams { page, limit, search };
    products_service
        .get_paginated_products(params)
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

// Clients management commands
#[tauri::command]
async fn get_clients(
    db_state: State<'_, DatabaseState>,
) -> Result<Vec<database::models::Client>, String> {
    let db = db_state.lock().await;
    let clients_service = ClientsService::new(db.pool.clone());

    clients_service
        .get_all()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_clients_paginated(
    db_state: State<'_, DatabaseState>,
    page: i64,
    limit: i64,
    search: Option<String>,
) -> Result<ClientsPaginatedResponse<database::models::Client>, String> {
    let db = db_state.lock().await;
    let clients_service = ClientsService::new(db.pool.clone());
    
    let params = ClientsPaginationParams { page, limit, search };
    clients_service
        .get_paginated(params)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_client(
    db_state: State<'_, DatabaseState>,
    request: CreateClientRequest,
) -> Result<database::models::Client, String> {
    let db = db_state.lock().await;
    let clients_service = ClientsService::new(db.pool.clone());

    clients_service
        .create(CreateClient { name: request.name })
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn bulk_create_clients(
    db_state: State<'_, DatabaseState>,
    request: BulkCreateClientsRequest,
) -> Result<Vec<database::models::Client>, String> {
    let db = db_state.lock().await;
    let clients_service = ClientsService::new(db.pool.clone());

    clients_service
        .bulk_create_clients(request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_client(
    db_state: State<'_, DatabaseState>,
    request: UpdateClientRequest,
) -> Result<database::models::Client, String> {
    let db = db_state.lock().await;
    let clients_service = ClientsService::new(db.pool.clone());

    clients_service
        .update(request.id, request.name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_client(
    db_state: State<'_, DatabaseState>,
    client_id: String,
) -> Result<bool, String> {
    let db = db_state.lock().await;
    let clients_service = ClientsService::new(db.pool.clone());

    let uuid = uuid::Uuid::parse_str(&client_id).map_err(|e| format!("Invalid UUID: {}", e))?;

    clients_service
        .delete(uuid)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_multiple_clients(
    db_state: State<'_, DatabaseState>,
    client_ids: Vec<String>,
) -> Result<u64, String> {
    let db = db_state.lock().await;
    let clients_service = ClientsService::new(db.pool.clone());

    let uuids: Result<Vec<uuid::Uuid>, _> = client_ids.iter().map(|id| uuid::Uuid::parse_str(id)).collect();
    let uuids = uuids.map_err(|e| format!("Invalid UUID: {}", e))?;

    clients_service
        .delete_multiple_clients(uuids)
        .await
        .map_err(|e| e.to_string())
}

// Reports management commands
#[tauri::command]
async fn create_report(
    db_state: State<'_, DatabaseState>,
    request: CreateReportRequest,
    reported_by: String,
) -> Result<database::models::NonConformityReport, String> {
    let db = db_state.lock().await;
    let reports_service = ReportsService::new(db.pool.clone());

    let user_uuid = uuid::Uuid::parse_str(&reported_by)
        .map_err(|e| format!("Invalid user ID: {}", e))?;

    reports_service
        .create_report(request, user_uuid)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_reports(
    db_state: State<'_, DatabaseState>,
) -> Result<Vec<database::models::NonConformityReport>, String> {
    let db = db_state.lock().await;
    let reports_service = ReportsService::new(db.pool.clone());

    reports_service
        .get_all_reports()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_reports_paginated(
    db_state: State<'_, DatabaseState>,
    page: i64,
    limit: i64,
    search: Option<String>,
    product_id: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
) -> Result<ReportsPaginatedResponse<database::models::NonConformityReport>, String> {
    let db = db_state.lock().await;
    let reports_service = ReportsService::new(db.pool.clone());
    
    println!(
        "[TAURI] get_reports_paginated received - page={}, limit={}, search={:?}, product_id={:?}, start_date={:?}, end_date={:?}",
        page, limit, search, product_id, start_date, end_date
    );
    
    // Additional debug to check for empty strings vs None
    if let Some(ref s) = search {
        println!("[TAURI] search string length: {}, content: '{}'", s.len(), s);
    }
    if let Some(ref p) = product_id {
        println!("[TAURI] product_id string length: {}, content: '{}'", p.len(), p);
    }
    if let Some(ref sd) = start_date {
        println!("[TAURI] start_date string length: {}, content: '{}'", sd.len(), sd);
    }
    if let Some(ref ed) = end_date {
        println!("[TAURI] end_date string length: {}, content: '{}'", ed.len(), ed);
    }

    let params = ReportsPaginationParams { 
        page, 
        limit, 
        search,
        product_id,
        start_date,
        end_date,
    };
    reports_service
        .get_paginated_reports(params)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_description_types(db_state: tauri::State<'_, DatabaseState>) -> Result<Vec<NcDes>, String> {
    let db = db_state.lock().await;
    let reports_service = ReportsService::new(db.pool.clone());

    reports_service
        .get_description_types()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_formats(db_state: tauri::State<'_, DatabaseState>) -> Result<Vec<Format>, String> {
    let db = db_state.lock().await;
    let reports_service = ReportsService::new(db.pool.clone());

    reports_service
        .get_formats()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_report_status(
    db_state: State<'_, DatabaseState>,
    report_id: String,
    status: String,
) -> Result<database::models::NonConformityReport, String> {
    let db = db_state.lock().await;
    let reports_service = ReportsService::new(db.pool.clone());

    let uuid = uuid::Uuid::parse_str(&report_id)
        .map_err(|e| format!("Invalid UUID: {}", e))?;

    reports_service
        .update_report_status(uuid, status)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_report_performance(
    db_state: State<'_, DatabaseState>,
    report_id: String,
    performance: String,
) -> Result<bool, String> {
    let db = db_state.lock().await;
    let reports_service = ReportsService::new(db.pool.clone());
    
    let uuid = Uuid::parse_str(&report_id)
        .map_err(|e| format!("Invalid UUID: {}", e))?;

    reports_service
        .update_report_performance(uuid, performance)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_report(
    db_state: State<'_, DatabaseState>,
    reportId: String,
    request: UpdateReportRequest,
) -> Result<NonConformityReport, String> {
    let db = db_state.lock().await;
    let reports_service = ReportsService::new(db.pool.clone());

    println!(
        "[TAURI] update_report called with reportId present: {}",
        !reportId.is_empty()
    );
    println!(
        "[TAURI] update_report request fields: line_id={}, product_id={}, report_date={}, production_date={}",
        request.line_id,
        request.product_id,
        request.report_date,
        request.production_date
    );

    let uuid = Uuid::parse_str(&reportId)
        .map_err(|e| format!("Invalid UUID: {}", e))?;

    reports_service
        .update_report(uuid, request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_report(
    db_state: State<'_, DatabaseState>,
    report_id: String,
) -> Result<bool, String> {
    let db = db_state.lock().await;
    let reports_service = ReportsService::new(db.pool.clone());

    let uuid = uuid::Uuid::parse_str(&report_id)
        .map_err(|e| format!("Invalid UUID: {}", e))?;

    reports_service
        .delete_report(uuid)
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
            get_users_paginated,
            // Lines management
            get_lines,
            get_lines_paginated,
            create_line,
            bulk_create_lines,
            update_line,
            delete_line,
            delete_multiple_lines,
            // Products management
            get_products,
            get_products_paginated,
            create_product,
            bulk_create_products,
            update_product,
            delete_product,
            delete_multiple_products,
            // Clients management
            get_clients,
            get_clients_paginated,
            create_client,
            bulk_create_clients,
            update_client,
            delete_client,
            delete_multiple_clients,
            // User management
            change_password,
            update_user_role,
            create_user,
            update_username,
            delete_user,
            update_user_password,
            // Reports management
            create_report,
            get_reports,
            get_reports_paginated,
            get_description_types,
            get_formats,
            update_report_status,
            update_report_performance,
            update_report,
            delete_report,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
