use sqlx::PgPool;
use anyhow::Result;
use uuid::Uuid;
use chrono::{Utc, NaiveDate, NaiveTime};
use serde::{Deserialize, Serialize};
use rust_decimal::Decimal;
use rust_decimal::prelude::FromPrimitive;
use crate::database::models::{NonConformityReport, NcDes, Format};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateReportRequest {
    pub line_id: String,
    pub product_id: String,
    pub format_id: Option<i32>,
    pub production_date: String, // Will be parsed to NaiveDate
    pub team: String,
    pub time: String, // Will be parsed to NaiveTime
    pub description_type: String,
    pub description_details: String,
    pub quantity: i32,
    pub claim_origin: String,
    pub valuation: f64,
    pub performance: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginationParams {
    pub page: i64,
    pub limit: i64,
    pub search: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub limit: i64,
    pub total_pages: i64,
}

pub struct ReportsService {
    pool: PgPool,
}

impl ReportsService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_report(&self, request: CreateReportRequest, reported_by: Uuid) -> Result<NonConformityReport> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        
        // Generate report number (format: NC-YYYYMMDD-XXXX)
        let report_number = self.generate_report_number().await?;
        
        // Parse dates and times
        let production_date = NaiveDate::parse_from_str(&request.production_date, "%Y-%m-%d")
            .map_err(|e| anyhow::anyhow!("Invalid production date format: {}", e))?;
        
        let time = NaiveTime::parse_from_str(&request.time, "%H:%M")
            .map_err(|e| anyhow::anyhow!("Invalid time format: {}", e))?;
        
        // Parse UUIDs
        let line_id = Uuid::parse_str(&request.line_id)
            .map_err(|e| anyhow::anyhow!("Invalid line ID: {}", e))?;
        
        let product_id = Uuid::parse_str(&request.product_id)
            .map_err(|e| anyhow::anyhow!("Invalid product ID: {}", e))?;

        // First insert the report
        sqlx::query(
            r#"
            INSERT INTO non_conformity_reports (
                id, report_number, report_date, line_id, product_id, format_id,
                production_date, team, time, description_type, description_details,
                quantity, claim_origin, valuation, performance, status, reported_by,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            "#,
        )
        .bind(id)
        .bind(&report_number)
        .bind(now)
        .bind(line_id)
        .bind(product_id)
        .bind(request.format_id)
        .bind(production_date)
        .bind(&request.team)
        .bind(time)
        .bind(&request.description_type)
        .bind(&request.description_details)
        .bind(request.quantity)
        .bind(&request.claim_origin)
        .bind(Decimal::from_f64(request.valuation).unwrap_or_default())
        .bind(&request.performance)
        .bind("open") // Default status
        .bind(reported_by)
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;

        // Then fetch the report with product name and format info via JOIN
        let report = sqlx::query_as::<_, NonConformityReport>(
            r#"
            SELECT ncr.*, 
                   p.designation as product_name,
                   CASE 
                       WHEN f.format_index IS NOT NULL THEN CONCAT(f.format_index, ' ', f.format_unit)
                       ELSE NULL 
                   END as format_display
            FROM non_conformity_reports ncr
            LEFT JOIN products p ON ncr.product_id = p.id
            LEFT JOIN formats f ON ncr.format_id = f.id
            WHERE ncr.id = $1
            "#,
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(report)
    }

    pub async fn get_all_reports(&self) -> Result<Vec<NonConformityReport>> {
        let reports = sqlx::query_as::<_, NonConformityReport>(
            r#"
            SELECT ncr.*, 
                   p.designation as product_name,
                   CASE 
                       WHEN f.format_index IS NOT NULL THEN CONCAT(f.format_index, ' ', f.format_unit)
                       ELSE NULL 
                   END as format_display
            FROM non_conformity_reports ncr
            LEFT JOIN products p ON ncr.product_id = p.id
            LEFT JOIN formats f ON ncr.format_id = f.id
            ORDER BY ncr.created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(reports)
    }

    pub async fn get_paginated_reports(&self, params: PaginationParams) -> Result<PaginatedResponse<NonConformityReport>> {
        let offset = (params.page - 1) * params.limit;
        
        let mut query = String::from(
            "SELECT ncr.*, p.designation as product_name, CASE WHEN f.format_index IS NOT NULL THEN CONCAT(f.format_index, ' ', f.format_unit) ELSE NULL END as format_display FROM non_conformity_reports ncr LEFT JOIN products p ON ncr.product_id = p.id LEFT JOIN formats f ON ncr.format_id = f.id WHERE 1=1"
        );
        let mut count_query = String::from(
            "SELECT COUNT(*) FROM non_conformity_reports ncr WHERE 1=1"
        );

        if let Some(search) = &params.search {
            if !search.trim().is_empty() {
                let search_condition = format!(
                    " AND (ncr.report_number ILIKE '%{}%' OR ncr.description_details ILIKE '%{}%' OR p.designation ILIKE '%{}%')",
                    search.replace('\'', "''"),
                    search.replace('\'', "''"),
                    search.replace('\'', "''")
                );
                query.push_str(&search_condition);
                count_query.push_str(&search_condition);
            }
        }

        query.push_str(" ORDER BY ncr.created_at DESC LIMIT $1 OFFSET $2");

        let reports = sqlx::query_as::<_, NonConformityReport>(&query)
            .bind(params.limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await?;

        let total: i64 = sqlx::query_scalar(&count_query)
            .fetch_one(&self.pool)
            .await?;

        let total_pages = (total + params.limit - 1) / params.limit;

        Ok(PaginatedResponse {
            data: reports,
            total,
            page: params.page,
            limit: params.limit,
            total_pages,
        })
    }

    pub async fn get_description_types(&self) -> Result<Vec<NcDes>> {
        let types = sqlx::query_as::<_, NcDes>(
            "SELECT * FROM nc_des ORDER BY name"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(types)
    }

    pub async fn get_formats(&self) -> Result<Vec<Format>> {
        let formats = sqlx::query_as::<_, Format>(
            "SELECT * FROM formats ORDER BY format_index"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(formats)
    }

    async fn generate_report_number(&self) -> Result<String> {
        let today = Utc::now().format("%Y%m%d").to_string();
        
        // Get the count of reports created today
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM non_conformity_reports WHERE DATE(created_at) = CURRENT_DATE"
        )
        .fetch_one(&self.pool)
        .await?;

        let sequence = count + 1;
        Ok(format!("NC-{}-{:04}", today, sequence))
    }

    pub async fn update_report_status(&self, report_id: Uuid, status: String) -> Result<NonConformityReport> {
        let now = Utc::now();
        
        let report = sqlx::query_as::<_, NonConformityReport>(
            "UPDATE non_conformity_reports SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *"
        )
        .bind(&status)
        .bind(now)
        .bind(report_id)
        .fetch_one(&self.pool)
        .await?;

        Ok(report)
    }

    pub async fn delete_report(&self, report_id: Uuid) -> Result<bool> {
        let result = sqlx::query("DELETE FROM non_conformity_reports WHERE id = $1")
            .bind(report_id)
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}