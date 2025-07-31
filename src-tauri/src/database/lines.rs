use sqlx::PgPool;
use anyhow::Result;
use uuid::Uuid;
use chrono::Utc;
use serde::{Deserialize, Serialize};

use super::models::ProductionLine;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateLineRequest {
    pub name: String,
    pub description: Option<String>,
    pub is_active: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BulkCreateLinesRequest {
    pub lines: Vec<CreateLineRequest>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateLineRequest {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub is_active: bool,
}

pub struct LinesService {
    pool: PgPool,
}

impl LinesService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn get_all_lines(&self) -> Result<Vec<ProductionLine>> {
        let lines = sqlx::query_as::<_, ProductionLine>(
            "SELECT id, name, description, is_active, created_at, updated_at FROM production_lines ORDER BY name ASC"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(lines)
    }

    pub async fn get_line_by_id(&self, line_id: &Uuid) -> Result<Option<ProductionLine>> {
        let line = sqlx::query_as::<_, ProductionLine>(
            "SELECT id, name, description, is_active, created_at, updated_at FROM production_lines WHERE id = $1"
        )
        .bind(line_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(line)
    }

    pub async fn create_line(&self, request: CreateLineRequest) -> Result<ProductionLine> {
        let line_id = Uuid::new_v4();
        let now = Utc::now();

        sqlx::query(
            "INSERT INTO production_lines (id, name, description, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6)"
        )
        .bind(&line_id)
        .bind(&request.name)
        .bind(&request.description)
        .bind(request.is_active)
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;

        let line = ProductionLine {
            id: line_id,
            name: request.name,
            description: request.description,
            is_active: request.is_active,
            created_at: now,
            updated_at: now,
        };

        Ok(line)
    }

    pub async fn bulk_create_lines(&self, request: BulkCreateLinesRequest) -> Result<Vec<ProductionLine>> {
        let mut created_lines = Vec::new();
        
        for line_request in request.lines {
            let created_line = self.create_line(line_request).await?;
            created_lines.push(created_line);
        }

        Ok(created_lines)
    }

    pub async fn update_line(&self, request: UpdateLineRequest) -> Result<ProductionLine> {
        let now = Utc::now();

        sqlx::query(
            "UPDATE production_lines SET name = $2, description = $3, is_active = $4, updated_at = $5 WHERE id = $1"
        )
        .bind(&request.id)
        .bind(&request.name)
        .bind(&request.description)
        .bind(request.is_active)
        .bind(now)
        .execute(&self.pool)
        .await?;

        let line = ProductionLine {
            id: request.id,
            name: request.name,
            description: request.description,
            is_active: request.is_active,
            created_at: now, // This would ideally be fetched from DB
            updated_at: now,
        };

        Ok(line)
    }

    pub async fn delete_line(&self, line_id: &Uuid) -> Result<bool> {
        let result = sqlx::query("DELETE FROM production_lines WHERE id = $1")
            .bind(line_id)
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn delete_multiple_lines(&self, line_ids: Vec<Uuid>) -> Result<u64> {
        let mut total_deleted = 0;
        
        for line_id in line_ids {
            let result = sqlx::query("DELETE FROM production_lines WHERE id = $1")
                .bind(&line_id)
                .execute(&self.pool)
                .await?;
            total_deleted += result.rows_affected();
        }

        Ok(total_deleted)
    }
}
