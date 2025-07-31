use sqlx::PgPool;
use anyhow::{Result, anyhow};
use bcrypt::{hash, verify, DEFAULT_COST};
use uuid::Uuid;
use chrono::Utc;
use std::str::FromStr;
use serde::{Deserialize, Serialize};

use super::models::{User, CreateUser, UserRole};

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

    pub async fn change_password(
        &self,
        user_id: &Uuid,
        current_password: &str,
        new_password: &str,
    ) -> Result<()> {
        // Get the user
        let user = self.get_user_by_id(user_id).await?
            .ok_or_else(|| anyhow!("User not found"))?;

        // Verify current password
        if !verify(current_password, &user.password_hash)? {
            return Err(anyhow!("Current password is incorrect"));
        }

        // Hash new password
        let new_password_hash = hash(new_password, DEFAULT_COST)?;
        let now = Utc::now();

        // Update password
        sqlx::query(
            "UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3"
        )
        .bind(&new_password_hash)
        .bind(now)
        .bind(user_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn update_user_role(
        &self,
        user_id: &Uuid,
        new_role: &str,
    ) -> Result<()> {
        // Validate role using FromStr
        if let Err(e) = UserRole::from_str(new_role) {
            return Err(anyhow!("Invalid role specified"));
        }

        let now = Utc::now();

        sqlx::query(
            "UPDATE users SET role = $1, updated_at = $2 WHERE id = $3"
        )
        .bind(new_role)
        .bind(now)
        .bind(user_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn update_username(
        &self,
        user_id: &Uuid,
        new_username: &str,
    ) -> Result<()> {
        // Check if username already exists
        let existing_user = sqlx::query_as::<_, User>(
            "SELECT id, username, password_hash, role, created_at, updated_at FROM users WHERE username = $1 AND id != $2"
        )
        .bind(new_username)
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await?;

        if existing_user.is_some() {
            return Err(anyhow!("Username already exists"));
        }

        let now = Utc::now();

        sqlx::query(
            "UPDATE users SET username = $1, updated_at = $2 WHERE id = $3"
        )
        .bind(new_username)
        .bind(now)
        .bind(user_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn delete_user(&self, user_id: &Uuid) -> Result<()> {
        sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(user_id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn update_user_password(
        &self,
        user_id: &Uuid,
        new_password: &str,
    ) -> Result<()> {
        let password_hash = hash(new_password, DEFAULT_COST)?;
        let now = Utc::now();

        sqlx::query(
            "UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3"
        )
        .bind(&password_hash)
        .bind(now)
        .bind(user_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}
