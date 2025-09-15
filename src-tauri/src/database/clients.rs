use anyhow::Result;
use sqlx::PgPool;
use uuid::Uuid;
use serde::{Deserialize, Serialize};

use crate::database::models::{Client, CreateClient};

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginationParams {
    pub page: i64,
    pub limit: i64,
    pub search: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub limit: i64,
    pub total_pages: i64,
    pub has_next: bool,
    pub has_prev: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateClientRequest {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BulkCreateClientsRequest {
    pub clients: Vec<CreateClientRequest>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateClientRequest {
    pub id: Uuid,
    pub name: String,
}

pub struct ClientsService {
    pool: PgPool,
}

impl ClientsService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn get_all(&self) -> Result<Vec<Client>> {
        let clients = sqlx::query_as::<_, Client>(
            "SELECT id, name, created_at, updated_at FROM clients ORDER BY name"
        )
        .fetch_all(&self.pool)
        .await?;
        
        Ok(clients)
    }

    pub async fn get_paginated(&self, params: PaginationParams) -> Result<PaginatedResponse<Client>> {
        let offset = (params.page - 1) * params.limit;
        
        let mut query = "SELECT id, name, created_at, updated_at FROM clients".to_string();
        let mut count_query = "SELECT COUNT(*) as count FROM clients".to_string();
        
        if let Some(search) = &params.search {
            let search_condition = format!(" WHERE name ILIKE '%{}%'", search.replace("'", "''"));
            query.push_str(&search_condition);
            count_query.push_str(&search_condition);
        }
        
        query.push_str(" ORDER BY name LIMIT $1 OFFSET $2");
        
        let clients = sqlx::query_as::<_, Client>(&query)
            .bind(params.limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await?;
            
        let total: (i64,) = sqlx::query_as(&count_query)
            .fetch_one(&self.pool)
            .await?;
            
        let total_pages = (total.0 + params.limit - 1) / params.limit;
        
        Ok(PaginatedResponse {
            data: clients,
            total: total.0,
            page: params.page,
            limit: params.limit,
            total_pages,
            has_next: params.page < total_pages,
            has_prev: params.page > 1,
        })
    }


    pub async fn create(&self, client: CreateClient) -> Result<Client> {
        let client = sqlx::query_as::<_, Client>(
            r#"
            INSERT INTO clients (id, name, created_at, updated_at)
            VALUES ($1, $2, NOW(), NOW())
            RETURNING id, name, created_at, updated_at
            "#
        )
        .bind(Uuid::new_v4())
        .bind(client.name)
        .fetch_one(&self.pool)
        .await?;
        
        Ok(client)
    }

    pub async fn update(&self, id: Uuid, name: String) -> Result<Client> {
        let client = sqlx::query_as::<_, Client>(
            r#"
            UPDATE clients 
            SET name = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id, name, created_at, updated_at
            "#
        )
        .bind(name)
        .bind(id)
        .fetch_one(&self.pool)
        .await?;
        
        Ok(client)
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool> {
        let result = sqlx::query("DELETE FROM clients WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
            
        Ok(result.rows_affected() > 0)
    }

    pub async fn bulk_create_clients(&self, request: BulkCreateClientsRequest) -> Result<Vec<Client>> {
        let mut created_clients = Vec::new();

        for c in request.clients {
            let created = self.create(CreateClient { name: c.name }).await?;
            created_clients.push(created);
        }

        Ok(created_clients)
    }

}
