use sqlx::PgPool;
use anyhow::Result;
use uuid::Uuid;
use chrono::Utc;
use serde::{Deserialize, Serialize};

use super::models::Product;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProductRequest {
    pub designation: String,
    pub code: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BulkCreateProductsRequest {
    pub products: Vec<CreateProductRequest>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProductRequest {
    pub id: Uuid,
    pub designation: String,
    pub code: String,
}

pub struct ProductsService {
    pool: PgPool,
}

impl ProductsService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn get_all_products(&self) -> Result<Vec<Product>> {
        let products = sqlx::query_as::<_, Product>(
            "SELECT id, designation, code, created_at, updated_at FROM products ORDER BY designation ASC"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(products)
    }

    pub async fn get_product_by_id(&self, product_id: &Uuid) -> Result<Option<Product>> {
        let product = sqlx::query_as::<_, Product>(
            "SELECT id, designation, code, created_at, updated_at FROM products WHERE id = $1"
        )
        .bind(product_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(product)
    }

    pub async fn create_product(&self, request: CreateProductRequest) -> Result<Product> {
        let product_id = Uuid::new_v4();
        let now = Utc::now();

        sqlx::query(
            "INSERT INTO products (id, designation, code, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5)"
        )
        .bind(&product_id)
        .bind(&request.designation)
        .bind(&request.code)
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;

        let product = Product {
            id: product_id,
            designation: request.designation,
            code: request.code,
            created_at: now,
            updated_at: now,
        };

        Ok(product)
    }

    pub async fn bulk_create_products(&self, request: BulkCreateProductsRequest) -> Result<Vec<Product>> {
        let mut created_products = Vec::new();
        
        for product_request in request.products {
            let created_product = self.create_product(product_request).await?;
            created_products.push(created_product);
        }

        Ok(created_products)
    }

    pub async fn update_product(&self, request: UpdateProductRequest) -> Result<Product> {
        let now = Utc::now();

        sqlx::query(
            "UPDATE products SET designation = $2, code = $3, updated_at = $4 WHERE id = $1"
        )
        .bind(&request.id)
        .bind(&request.designation)
        .bind(&request.code)
        .bind(now)
        .execute(&self.pool)
        .await?;

        let product = Product {
            id: request.id,
            designation: request.designation,
            code: request.code,
            created_at: now, // This would ideally be fetched from DB
            updated_at: now,
        };

        Ok(product)
    }

    pub async fn delete_product(&self, product_id: &Uuid) -> Result<bool> {
        let result = sqlx::query("DELETE FROM products WHERE id = $1")
            .bind(product_id)
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn delete_multiple_products(&self, product_ids: Vec<Uuid>) -> Result<u64> {
        let mut total_deleted = 0;
        
        for product_id in product_ids {
            let result = sqlx::query("DELETE FROM products WHERE id = $1")
                .bind(&product_id)
                .execute(&self.pool)
                .await?;
            total_deleted += result.rows_affected();
        }

        Ok(total_deleted)
    }
}
