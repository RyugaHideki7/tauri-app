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
    pub report_date: String, // Will be parsed to NaiveDate
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
    pub product_id: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
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
        let report_date = NaiveDate::parse_from_str(&request.report_date, "%Y-%m-%d")
            .map_err(|e| anyhow::anyhow!("Invalid report date format: {}", e))?;
            
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
        .bind(report_date)
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

        // Then fetch the report with product name, line name, and format info via JOIN
        let report = sqlx::query_as::<_, NonConformityReport>(
            r#"
            SELECT ncr.*, 
                   p.designation as product_name,
                   pl.name as line_name,
                   CASE 
                       WHEN f.format_index IS NOT NULL THEN CONCAT(f.format_index, ' ', f.format_unit)
                       ELSE NULL 
                   END as format_display
            FROM non_conformity_reports ncr
            LEFT JOIN products p ON ncr.product_id = p.id
            LEFT JOIN production_lines pl ON ncr.line_id = pl.id
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
        println!("[REPORTS_SERVICE] Received params: page={}, limit={}, search={:?}, product_id={:?}, start_date={:?}, end_date={:?}", 
                 params.page, params.limit, params.search, params.product_id, params.start_date, params.end_date);
        
        let offset = (params.page - 1) * params.limit;
        
        let mut query = String::from(
            r#"
            SELECT ncr.*, 
                   p.designation as product_name,
                   pl.name as line_name,
                   CASE 
                     WHEN f.format_index IS NOT NULL THEN CONCAT(f.format_index, ' ', f.format_unit)
                     ELSE NULL 
                   END as format_display
            FROM non_conformity_reports ncr
            LEFT JOIN products p ON ncr.product_id = p.id
            LEFT JOIN formats f ON ncr.format_id = f.id
            LEFT JOIN production_lines pl ON ncr.line_id = pl.id
            WHERE 1=1
            "#
        );
        
        let mut count_query = String::from(
            "SELECT COUNT(*) FROM non_conformity_reports ncr WHERE 1=1"
        );
        
        let mut conditions = Vec::new();
        let mut bind_values = Vec::new();
        
        // Collect all filter conditions and their values
        if let Some(search) = &params.search {
            println!("[REPORTS_SERVICE] Processing search: '{}'", search);
            if !search.trim().is_empty() {
                println!("[REPORTS_SERVICE] Adding search condition");
                conditions.push("(ncr.report_number ILIKE $PLACEHOLDER OR ncr.description_details ILIKE $PLACEHOLDER)");
                bind_values.push(format!("%{}%", search));
            } else {
                println!("[REPORTS_SERVICE] Search is empty, skipping");
            }
        } else {
            println!("[REPORTS_SERVICE] Search is None");
        }

        if let Some(product_id) = &params.product_id {
            println!("[REPORTS_SERVICE] Processing product_id: '{}'", product_id);
            if !product_id.trim().is_empty() {
                println!("[REPORTS_SERVICE] Adding product_id condition");
                let product_uuid = uuid::Uuid::parse_str(product_id)
                    .map_err(|e| anyhow::anyhow!("Invalid product UUID: {}", e))?;
                conditions.push("ncr.product_id = $PLACEHOLDER");
                bind_values.push(product_uuid.to_string());
            } else {
                println!("[REPORTS_SERVICE] Product_id is empty, skipping");
            }
        } else {
            println!("[REPORTS_SERVICE] Product_id is None");
        }

        if let Some(start_date) = &params.start_date {
            println!("[REPORTS_SERVICE] Processing start_date: '{}'", start_date);
            if !start_date.trim().is_empty() {
                println!("[REPORTS_SERVICE] Adding start_date condition");
                let _start_date_parsed = chrono::NaiveDate::parse_from_str(start_date, "%Y-%m-%d")
                    .map_err(|e| anyhow::anyhow!("Invalid start date format: {}", e))?;
                conditions.push("ncr.report_date >= $PLACEHOLDER");
                bind_values.push(start_date.clone());
            } else {
                println!("[REPORTS_SERVICE] Start_date is empty, skipping");
            }
        } else {
            println!("[REPORTS_SERVICE] Start_date is None");
        }

        if let Some(end_date) = &params.end_date {
            println!("[REPORTS_SERVICE] Processing end_date: '{}'", end_date);
            if !end_date.trim().is_empty() {
                println!("[REPORTS_SERVICE] Adding end_date condition");
                let _end_date_parsed = chrono::NaiveDate::parse_from_str(end_date, "%Y-%m-%d")
                    .map_err(|e| anyhow::anyhow!("Invalid end date format: {}", e))?;
                conditions.push("ncr.report_date <= $PLACEHOLDER");
                bind_values.push(end_date.clone());
            } else {
                println!("[REPORTS_SERVICE] End_date is empty, skipping");
            }
        } else {
            println!("[REPORTS_SERVICE] End_date is None");
        }
        
        println!("[REPORTS_SERVICE] Found {} conditions to apply", conditions.len());
        
        // Build the final queries with proper parameter placeholders
        let mut param_index = 1;
        for condition in &conditions {
            let condition_with_params = if condition.contains("ILIKE $PLACEHOLDER OR") {
                // For search condition that uses the same parameter twice
                condition.replace("$PLACEHOLDER", &format!("${}", param_index))
            } else {
                condition.replace("$PLACEHOLDER", &format!("${}", param_index))
            };
            query.push_str(&format!(" AND {}", condition_with_params));
            count_query.push_str(&format!(" AND {}", condition_with_params));
            param_index += 1;
        }
        
        query.push_str(" ORDER BY ncr.created_at DESC LIMIT $LIMIT OFFSET $OFFSET");
        
        // Replace LIMIT and OFFSET placeholders
        let final_query = query
            .replace("$LIMIT", &format!("${}", param_index))
            .replace("$OFFSET", &format!("${}", param_index + 1));
        
        println!("[REPORTS_SERVICE] Final query: {}", final_query);
        println!("[REPORTS_SERVICE] Count query: {}", count_query);
        println!("[REPORTS_SERVICE] Bind values: {:?}", bind_values);
        
        // Build the queries with proper binding
        let mut query_builder = sqlx::query_as::<_, NonConformityReport>(&final_query);
        let mut count_builder = sqlx::query_as::<_, (i64,)>(&count_query);
        
        // Bind filter parameters
        for (i, value) in bind_values.iter().enumerate() {
            if conditions[i].contains("product_id") {
                // Bind as UUID
                let uuid = uuid::Uuid::parse_str(value).unwrap();
                println!("[REPORTS_SERVICE] Binding UUID: {}", uuid);
                query_builder = query_builder.bind(uuid);
                count_builder = count_builder.bind(uuid);
            } else if conditions[i].contains("report_date") {
                // Bind as date
                let date = chrono::NaiveDate::parse_from_str(value, "%Y-%m-%d").unwrap();
                println!("[REPORTS_SERVICE] Binding date: {}", date);
                query_builder = query_builder.bind(date);
                count_builder = count_builder.bind(date);
            } else {
                // Bind as string (search pattern)
                println!("[REPORTS_SERVICE] Binding string: {}", value);
                query_builder = query_builder.bind(value);
                count_builder = count_builder.bind(value);
            }
        }
        
        // Bind limit and offset for main query
        println!("[REPORTS_SERVICE] Binding limit: {}, offset: {}", params.limit, offset);
        query_builder = query_builder.bind(params.limit).bind(offset);
        
        let reports = query_builder.fetch_all(&self.pool).await?;
        let total: (i64,) = count_builder.fetch_one(&self.pool).await?;
        
        println!("[REPORTS_SERVICE] Query executed successfully, found {} reports, total: {}", reports.len(), total.0);
        
        let total_pages = (total.0 as f64 / params.limit as f64).ceil() as i64;
        
        Ok(PaginatedResponse {
            data: reports,
            total: total.0,
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

    pub async fn update_report_performance(&self, report_id: Uuid, performance: String) -> Result<bool> {
        let result = sqlx::query(
            "UPDATE non_conformity_reports SET performance = $1, updated_at = $2 WHERE id = $3"
        )
        .bind(&performance)
        .bind(Utc::now())
        .bind(report_id)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn delete_report(&self, report_id: Uuid) -> Result<bool> {
        let result = sqlx::query("DELETE FROM non_conformity_reports WHERE id = $1")
            .bind(report_id)
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}