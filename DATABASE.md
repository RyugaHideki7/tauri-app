# Database Schema

## Core Entities

### 1. Users
Stores user account information and access control.

| Column    | Type | Description |
|-----------|------|-------------|
| id        | UUID | Primary key |
| username  | String | Unique username |
| password_hash| String | Hashed password |
| role      | Enum | User role: 'client', 'site01', 'site02','performance','admin','Consommateur' |
| created_at | Timestamp | When the user was created |
| updated_at | Timestamp | When the user was last updated |

### 2. Production Lines
Tracks different production lines in the facility.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | Line name (e.g., 'Ligne 1', 'Ligne 2') |
| description | Text | Optional description |
| is_active | Boolean | Whether the line is currently active |
| created_at | Timestamp | Creation timestamp |
| updated_at | Timestamp | Last update timestamp |

### 3. Products
Catalog of all products being manufactured.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| designation | String | Product name/designation |
| code | String | Product code/SKU |
| created_at | Timestamp | Creation timestamp |
| updated_at | Timestamp | Last update timestamp |

### 4. Non-Conformity Reports
Main table for tracking non-conformity incidents.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| report_number | String | Auto-generated report number |
| report_date | Timestamp | When the report was created |
| line_id | UUID (FK) | Reference to Production Line |
| product_id | UUID (FK) | Reference to Product |
| production_date | Date | Date of production |
| team | Enum | Team identifier: 'A', 'B', or 'C' |
| time | Time | Time of incident |
| description_type | Enum | Type of non-conformity: 'Physique', 'Chimique', 'Biologique', 'Process' |
| description_details | Text | Detailed description of the issue |
| quantity | Integer | Quantity affected (in bottles) |
| claim_origin | String |Enum 'client', 'site01', 'site02','Consommateur'|
| valuation | Decimal | Monetary valuation of the issue |
| performance | Text | Performance-related notes or metrics (optional) |
| status | Enum | Current status: 'open', 'in_progress', 'resolved', 'closed' |
| reported_by | UUID (FK) | User who created the report |
| created_at | Timestamp | Creation timestamp |
| updated_at | Timestamp | Last update timestamp |

## Relationships

- **Users** 1 → ∞ **Non-Conformity Reports**
  - One user can create multiple non-conformity reports

- **Production Lines** 1 → ∞ **Non-Conformity Reports**
  - One production line can have multiple non-conformity reports

- **Products** 1 → ∞ **Non-Conformity Reports**
  - One product can be associated with multiple non-conformity reports

## Enumerated Types

### Description Types
- **Physique** - Physical issues (e.g., damaged packaging, incorrect labeling)
- **Chimique** - Chemical issues (e.g., contamination, composition problems)
- **Biologique** - Biological issues (e.g., microbial contamination)
- **Process** - Process-related issues (e.g., temperature deviation, timing issues)

### Status Types
- **Open** - Newly created report
- **In Progress** - Under investigation/being addressed
- **Resolved** - Issue has been addressed but not yet verified
- **Closed** - Issue has been verified and closed

## Indexes

1. `idx_non_conformity_reports_report_number` - For quick lookup by report number
2. `idx_non_conformity_reports_line_id` - For filtering by production line
3. `idx_non_conformity_reports_product_id` - For filtering by product
4. `idx_non_conformity_reports_status` - For filtering by status
5. `idx_non_conformity_reports_report_date` - For date-based queries and reporting
