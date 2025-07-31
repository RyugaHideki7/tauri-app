pub mod models;
pub mod migrations;
pub mod auth;

use sqlx::{postgres::{PgPool, PgPoolOptions}};
use anyhow::Result;
use std::env;

pub struct Database {
    pub pool: PgPool,
}

impl Database {
    pub async fn new() -> Result<Self> {
        // Get database URL from environment variable or use default
        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://postgres:1@localhost/tauri_app".to_string());
        
        println!("Attempting to connect to database: {}", database_url);
        
        // Create connection pool with timeout and retry settings
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .acquire_timeout(std::time::Duration::from_secs(10))
            .connect(&database_url)
            .await
            .map_err(|e| {
                eprintln!("Failed to connect to database: {}", e);
                e
            })?;
        
        println!("Database connection established successfully");
        
        let db = Database { pool };
        
        // Run migrations with error handling
        println!("Running database migrations...");
        if let Err(e) = db.run_migrations().await {
            eprintln!("Migration failed: {}", e);
            return Err(e);
        }
        println!("Database migrations completed successfully");
        
        Ok(db)
    }
    
    async fn run_migrations(&self) -> Result<()> {
        migrations::run_migrations(&self.pool).await
    }
}
