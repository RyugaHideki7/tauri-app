use anyhow::Result;
use sqlx::PgPool;
use uuid::Uuid;
use serde::{Deserialize, Serialize};

use crate::database::models::{Client, CreateClient};

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

    pub async fn get_by_id(&self, id: Uuid) -> Result<Option<Client>> {
        let client = sqlx::query_as::<_, Client>(
            "SELECT id, name, created_at, updated_at FROM clients WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;
        
        Ok(client)
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

    pub async fn delete_multiple_clients(&self, client_ids: Vec<Uuid>) -> Result<u64> {
        let mut total_deleted = 0u64;

        for id in client_ids {
            let result = sqlx::query("DELETE FROM clients WHERE id = $1")
                .bind(id)
                .execute(&self.pool)
                .await?;
            total_deleted += result.rows_affected();
        }

        Ok(total_deleted)
    }
}
