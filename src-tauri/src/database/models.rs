use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc, NaiveDate, NaiveTime};
use std::str::FromStr;
use uuid::Uuid;
use rust_decimal::Decimal;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Client {
    pub id: Uuid,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateClient {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct NcDes {
    pub id: i32,
    pub name: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub password_hash: String,
    pub role: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateUser {
    pub username: String,
    pub password: String,
    pub role: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProductionLine {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Product {
    pub id: Uuid,
    pub designation: String,
    pub code: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Format {
    pub id: i32,
    pub format_index: i32,
    pub format_unit: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct NonConformityReport {
    pub id: Uuid,
    pub report_number: String,
    pub report_date: DateTime<Utc>,
    pub line_id: Uuid,
    pub product_id: Uuid,
    pub format_id: Option<i32>,
    pub production_date: NaiveDate,
    pub team: String, // A, B, or C
    pub time: NaiveTime,
    pub description_type: String, // Physique, Chimique, Biologique, Process
    pub description_details: String,
    pub quantity: i32,
    pub claim_origin: String, // client, site01, site02, Consommateur
    pub claim_origin_detail: Option<String>, // Détail de la réclamation
    pub valuation: Decimal,
    pub performance: Option<String>,
    pub status: String, // open, in_progress, resolved, closed
    pub reported_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub product_name: Option<String>, // Joined from products table
    pub line_name: Option<String>,    // Joined from production_lines table
    pub format_display: Option<String>, // Joined from formats table (format_index + format_unit)
}

// Enums for validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UserRole {
    #[serde(rename = "Reclamation client")]
    ReclamationClient,
    #[serde(rename = "Retour client")]
    RetourClient,
    Site01,
    Site02,
    Performance,
    Admin,
    Consommateur,
}

impl UserRole {
    pub fn as_str(&self) -> &'static str {
        match self {
            UserRole::ReclamationClient => "Reclamation client",
            UserRole::RetourClient => "Retour client",
            UserRole::Site01 => "site01",
            UserRole::Site02 => "site02",
            UserRole::Performance => "performance",
            UserRole::Admin => "admin",
            UserRole::Consommateur => "consommateur",
        }
    }
}

impl FromStr for UserRole {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Reclamation client" => Ok(UserRole::ReclamationClient),
            "Retour client" => Ok(UserRole::RetourClient),
            "site01" => Ok(UserRole::Site01),
            "site02" => Ok(UserRole::Site02),
            "performance" => Ok(UserRole::Performance),
            "admin" => Ok(UserRole::Admin),
            "consommateur" => Ok(UserRole::Consommateur),
            _ => Err(format!("Invalid role: {}", s)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Team {
    A,
    B,
    C,
}

impl Team {
    pub fn as_str(&self) -> &'static str {
        match self {
            Team::A => "A",
            Team::B => "B",
            Team::C => "C",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DescriptionType {
    Physique,
    Chimique,
    Biologique,
    Process,
}

impl DescriptionType {
    pub fn as_str(&self) -> &'static str {
        match self {
            DescriptionType::Physique => "Physique",
            DescriptionType::Chimique => "Chimique",
            DescriptionType::Biologique => "Biologique",
            DescriptionType::Process => "Process",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClaimOrigin {
    #[serde(rename = "Reclamation client")]
    ReclamationClient,
    Site01,
    Site02,
    Consommateur,
}

impl ClaimOrigin {
    pub fn as_str(&self) -> &'static str {
        match self {
            ClaimOrigin::ReclamationClient => "Reclamation client",
            ClaimOrigin::Site01 => "site01",
            ClaimOrigin::Site02 => "site02",
            ClaimOrigin::Consommateur => "Consommateur",
        }
    }
}

impl FromStr for ClaimOrigin {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Reclamation client" => Ok(ClaimOrigin::ReclamationClient),
            "site01" => Ok(ClaimOrigin::Site01),
            "site02" => Ok(ClaimOrigin::Site02),
            "Consommateur" => Ok(ClaimOrigin::Consommateur),
            _ => Err(format!("Invalid claim origin: {}", s)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Status {
    Open,
    InProgress,
    Resolved,
    Closed,
}

impl Status {
    pub fn as_str(&self) -> &'static str {
        match self {
            Status::Open => "open",
            Status::InProgress => "in_progress",
            Status::Resolved => "resolved",
            Status::Closed => "closed",
        }
    }
}
