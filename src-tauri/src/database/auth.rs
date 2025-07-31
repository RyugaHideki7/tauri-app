use sqlx::PgPool;
use anyhow::Result;
use bcrypt::{hash, verify, DEFAULT_COST};
use uuid::Uuid;
use chrono::Utc;
use serde::{Deserialize, Serialize};

use super::models::{User, CreateUser};

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub success: bool,
    pub user: Option<UserInfo>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: uuid::Uuid,
    pub username: String,
    pub role: String,
}

pub struct AuthService {
    pool: PgPool,
}

impl AuthService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn login(&self, request: LoginRequest) -> Result<LoginResponse> {
        // Find user by username
        let user_result = sqlx::query_as::<_, User>(
            "SELECT id, username, password_hash, role, created_at, updated_at FROM users WHERE username = $1"
        )
        .bind(&request.username)
        .fetch_optional(&self.pool)
        .await?;

        match user_result {
            Some(user) => {
                // Verify password
                if verify(&request.password, &user.password_hash)? {
                    Ok(LoginResponse {
                        success: true,
                        user: Some(UserInfo {
                            id: user.id,
                            username: user.username,
                            role: user.role,
                        }),
                        message: "Login successful".to_string(),
                    })
                } else {
                    Ok(LoginResponse {
                        success: false,
                        user: None,
                        message: "Invalid password".to_string(),
                    })
                }
            }
            None => Ok(LoginResponse {
                success: false,
                user: None,
                message: "User not found".to_string(),
            }),
        }
    }

    pub async fn create_user(&self, create_user: CreateUser) -> Result<User> {
        let user_id = Uuid::new_v4();
        let password_hash = hash(&create_user.password, DEFAULT_COST)?;
        let now = Utc::now();

        sqlx::query(
            "
            INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            "
        )
        .bind(&user_id)
        .bind(&create_user.username)
        .bind(&password_hash)
        .bind(&create_user.role)
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;

        let user = User {
            id: user_id,
            username: create_user.username,
            password_hash,
            role: create_user.role,
            created_at: now,
            updated_at: now,
        };

        Ok(user)
    }

    pub async fn get_user_by_id(&self, user_id: &Uuid) -> Result<Option<User>> {
        let user = sqlx::query_as::<_, User>(
            "SELECT id, username, password_hash, role, created_at, updated_at FROM users WHERE id = $1"
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    pub async fn get_all_users(&self) -> Result<Vec<User>> {
        let users = sqlx::query_as::<_, User>(
            "SELECT id, username, password_hash, role, created_at, updated_at FROM users ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(users)
    }
}
