use sqlx::PgPool;
use anyhow::Result;
use uuid::Uuid;
use chrono::Utc;
use bcrypt::{hash, DEFAULT_COST};

pub async fn run_migrations(pool: &PgPool) -> Result<()> {
    // Create users table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role VARCHAR(50) NOT NULL CHECK (role IN ('client', 'site01', 'site02', 'performance', 'admin', 'Consommateur')),
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create production_lines table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS production_lines (
            id UUID PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create products table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS products (
            id UUID PRIMARY KEY,
            designation VARCHAR(255) NOT NULL,
            code VARCHAR(100) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create non_conformity_reports table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS non_conformity_reports (
            id UUID PRIMARY KEY,
            report_number VARCHAR(100) UNIQUE NOT NULL,
            report_date TIMESTAMPTZ NOT NULL,
            line_id UUID NOT NULL,
            product_id UUID NOT NULL,
            production_date DATE NOT NULL,
            team VARCHAR(1) NOT NULL CHECK (team IN ('A', 'B', 'C')),
            time TIME NOT NULL,
            description_type VARCHAR(50) NOT NULL CHECK (description_type IN ('Physique', 'Chimique', 'Biologique', 'Process')),
            description_details TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            claim_origin VARCHAR(50) NOT NULL CHECK (claim_origin IN ('client', 'site01', 'site02', 'Consommateur')),
            valuation DECIMAL(10, 2) NOT NULL,
            status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
            reported_by UUID NOT NULL,
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL,
            FOREIGN KEY (line_id) REFERENCES production_lines (id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
            FOREIGN KEY (reported_by) REFERENCES users (id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create indexes
    let index_queries = [
        "CREATE INDEX IF NOT EXISTS idx_non_conformity_reports_report_number ON non_conformity_reports (report_number)",
        "CREATE INDEX IF NOT EXISTS idx_non_conformity_reports_line_id ON non_conformity_reports (line_id)",
        "CREATE INDEX IF NOT EXISTS idx_non_conformity_reports_product_id ON non_conformity_reports (product_id)",
        "CREATE INDEX IF NOT EXISTS idx_non_conformity_reports_status ON non_conformity_reports (status)",
        "CREATE INDEX IF NOT EXISTS idx_non_conformity_reports_report_date ON non_conformity_reports (report_date)"
    ];

    for query in &index_queries {
        if let Err(e) = sqlx::query(*query).execute(pool).await {
            eprintln!("Error creating index: {}", e);
            // Continue with other indexes even if one fails
        }
    }

    // Create initial admin user if it doesn't exist
    if let Err(e) = create_initial_admin_user(pool).await {
        eprintln!("Error creating admin user: {}", e);
        // Continue even if admin user creation fails
    }

    // Create some sample data
    if let Err(e) = create_sample_data(pool).await {
        eprintln!("Error creating sample data: {}", e);
        // Continue even if sample data creation fails
    }

    Ok(())
}

async fn create_initial_admin_user(pool: &PgPool) -> Result<()> {
    // Check if admin user already exists
    let existing_admin: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM users WHERE username = $1"
    )
    .bind("admin")
    .fetch_one(pool)
    .await?;

    if existing_admin == 0 {
        // Create admin user
        let user_id = Uuid::new_v4();
        let username = "admin";
        let password = "admin123"; // In production, use a more secure password
        let password_hash = hash(password, DEFAULT_COST)?;
        let role = "admin";
        let now = Utc::now();

        sqlx::query(
            "INSERT INTO users (id, username, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)"
        )
        .bind(user_id)
        .bind(username)
        .bind(password_hash)
        .bind(role)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await?;
    }

    println!("Created initial admin user: username=admin, password=admin123");

    Ok(())
}

async fn create_sample_data(pool: &PgPool) -> Result<()> {
    // Check if sample data already exists
    let existing_lines: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM production_lines"
    )
    .fetch_one(pool)
    .await?;

    if existing_lines == 0 {
        let now = Utc::now();
        
        // Insert sample production lines one by one to avoid parameter binding issues
        let line1_id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO production_lines (id, name, description, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)"
        )
        .bind(line1_id)
        .bind("Line 1")
        .bind("Main production line")
        .bind(true)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await?;

        let line2_id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO production_lines (id, name, description, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)"
        )
        .bind(line2_id)
        .bind("Line 2")
        .bind("Secondary production line")
        .bind(true)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await?;

        // Insert sample products
        let product1_id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO products (id, designation, code, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)"
        )
        .bind(product1_id)
        .bind("Product A")
        .bind("PROD-A-001")
        .bind(now)
        .bind(now)
        .execute(pool)
        .await?;

        let product2_id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO products (id, designation, code, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)"
        )
        .bind(product2_id)
        .bind("Product B")
        .bind("PROD-B-001")
        .bind(now)
        .bind(now)
        .execute(pool)
        .await?;

        println!("Created sample production data");
    }

    Ok(())
}
