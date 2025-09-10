use sqlx::PgPool;
use anyhow::Result;
use uuid::Uuid;
use chrono::Utc;
use bcrypt::{hash, DEFAULT_COST};

const WILAYAS: [&str; 58] = [
    "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra",
    "Bechar", "Blida", "Bouira", "Tamanrasset", "Tbessa", "Tlemcen", "Tiaret",
    "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Setif", "Saefda", "Skikda",
    "Sidi Bel Abbes", "Annaba", "Guelma", "Constantine", "Medea", "Mostaganem",
    "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh", "Illizi", "Bordj Bou Arreridj",
    "Boumerdes", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
    "Souk Ahras", "Tipaza", "Mila", "Ain Defla", "Naama", "Ain Temouchent",
    "Ghardaefa", "Relizane", "El M'ghair", "El Menia", "Ouled Djellal",
    "Bordj Baji Mokhtar", "Béni Abbès", "Timimoun", "Touggourt", "Djanet",
    "In Salah", "In Guezzam"
];

pub async fn run_migrations(pool: &PgPool) -> Result<()> {
    // Create users table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role VARCHAR(50) NOT NULL CHECK (role IN ('Réclamation client', 'Retour client', 'site01', 'site02', 'performance', 'admin', 'consommateur')),
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create production_lines table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS production_lines (
            id UUID PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create products table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS products (
            id UUID PRIMARY KEY,
            designation VARCHAR(255) NOT NULL,
            code VARCHAR(100) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create formats table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS formats (
            id SERIAL PRIMARY KEY,
            format_index INTEGER UNIQUE NOT NULL,
            format_unit VARCHAR(10) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Insert initial format data if table is empty
    let format_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM formats")
        .fetch_one(pool)
        .await?;

    if format_count == 0 {
        let formats = [
            (500, "ML"),
            (750, "ML"),
            (1000, "ML"),
            (2000, "ML"),
            (200, "ML"),
            (300, "ML"),
            (240, "ML"),
            (250, "ML"),
            (330, "ML"),
            (1250, "ML"),
        ];

        for (format_index, format_unit) in &formats {
            sqlx::query(
                "INSERT INTO formats (format_index, format_unit) VALUES ($1, $2)"
            )
            .bind(format_index)
            .bind(format_unit)
            .execute(pool)
            .await?;
        }
        println!("Inserted initial format data");
    }

    // Create wilayas table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS wilayas (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Insert wilayas if table is empty
    let wilaya_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM wilayas")
        .fetch_one(pool)
        .await?;

    if wilaya_count == 0 {
        for wilaya in &WILAYAS {
            sqlx::query(
                "INSERT INTO wilayas (name) VALUES ($1) ON CONFLICT (name) DO NOTHING"
            )
            .bind(wilaya.to_string())
            .execute(pool)
            .await?;
        }
        println!("Inserted wilayas data");
    }

    // Create non_conformity_reports table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS non_conformity_reports (
            id UUID PRIMARY KEY,
            report_number VARCHAR(50) UNIQUE NOT NULL,
            report_date TIMESTAMPTZ NOT NULL,
            line_id UUID NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            format_id INTEGER REFERENCES formats(id) ON DELETE SET NULL,
            production_date DATE NOT NULL,
            team VARCHAR(1) NOT NULL CHECK (team IN ('A', 'B', 'C')),
            time TIME NOT NULL,
            description_type VARCHAR(50) NOT NULL CHECK (description_type IN ('Physique', 'Chimique', 'Biologique', 'Process')),
            description_details TEXT NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            claim_origin VARCHAR(20) NOT NULL CHECK (claim_origin IN ('client', 'site01', 'site02', 'consommateur')),
            claim_origin_detail TEXT,
            valuation DECIMAL(10, 2) NOT NULL,
            performance TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
            reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Add performance column to existing non_conformity_reports table if it doesn't exist
    sqlx::query(
        r#"
        ALTER TABLE non_conformity_reports 
        ADD COLUMN IF NOT EXISTS performance TEXT
        "#,
    )
    .execute(pool)
    .await?;

    // Remove the separate ALTER TABLE for format_id since it's now in the main CREATE TABLE

    // Create clients table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS clients (
            id UUID PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Insert initial client data if table is empty
    let client_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM clients")
        .fetch_one(pool)
        .await?;

    if client_count == 0 {
        let clients = [
            "ADRAR MAJIR FOOD",
            "Livestock",
            "AICHOUNI MOHAMMED",
            "AIR ALGERIE CATERING SPA",
            "AISSANI HACENE",
            "AISSOU MADJID",
            "AIT AISSA HOURIA",
            "ALLAL MOHAND",
            "ALOUANE AKILA",
            "AMIRAT MOHAMMED",
            "APC OUZELLAGUEN",
            "ASS. SPORTIVE SOUMAM AWZALAGUEN",
            "AZIZ FAOUZI",
            "BAHA NADJIA",
            "BELABED BORHANE EDDINE",
            "BELABED BORHANE EDDINE _EL TARF",
            "BENBRAHIM MOURAD KAMATO",
            "BENKHELLAT SAID",
            "BENNASROUNE MOURAD",
            "BIBI SID AHMED",
            "BOUABDALLAH MOHAMED",
            "BOUBOU HAKIM",
            "BOUDJA FAYSSAL",
            "CAPROS DISTRIBUTION INTERNATIONAL L",
            "CENTRE NATIONAL DES SPORTS ET DES",
            "CHEDAD SOFIANE",
            "CHU CONSTANTINE",
            "CRF ANP TIPAZA",
            "DAL MOSTAGANEM",
            "DEROUICHE BOUBAKER",
            "DIFALLAH BRAHIM",
            "DIRECTION DES ŒUVRES UNIVERSITAIRES",
            "DIVERSES ASSO CULTURELLES SPORTIVES",
            "DJENIDI TAHA ANISS",
            "DONATIONS GERANTS",
            "DONATIONS PERSONNEL ADMINISTRATIF",
            "EPE SPA ENTREPRISE DE GESTION",
            "EPE SPA SOCIETE D'INVESTISSEMENT",
            "EPIC OFFICE DES PARCS-SPORTS-LOISIR",
            "EURL AISSOU DISTRIBUTION",
            "EURL BOUCHERA DISTRIBUTION",
            "EURL CHILYA FOURNITURE",
            "EURL ELMODJAMAA EL TIDJARI",
            "EURL INDIGO DISTRIBUTION",
            "EURL JOY FOOD",
            "EURL K M BOISSONS",
            "EURL L'OURS FOR OIL AND GAS SERVICE",
            "EURL LA VAGUE VENTE ET DISTRIBUTION",
            "EURL LAMINE EL SAMI LITAGHDIA",
            "EURL NOOR DISTRIBUTION",
            "EURL NOOR DISTRIBUTION -AIN AZEL-",
            "EURL RESTOTRA",
            "EURL SMATI DISTRIBUTION",
            "EURL TUVIRETS BOISSONS",
            "EURL UNODIS",
            "FERHAT IBRAHIM",
            "GALOU SAID",
            "HAMADACHE ALLAOUA",
            "HERMAS TRADE IN FOODSTUFFS",
            "HOPITAL CENTRAL DE L'ARMEE",
            "ICHALAL MANAA",
            "IFRI EUROPEAN PARTNER",
            "IKRAM CATERING- HIOUAL NOUARA",
            "KADDOUR AZEDDINE",
            "KHELIL AHMED",
            "KORICHI BELKHIR",
            "LAAMIDI NOUR EL HILAL",
            "MAOUCHE BOUSSAAD",
            "MECHENOUAI MOHAMED LAMINE",
            "MEHIRA SALAH EDDINE",
            "MENANI BRAHIM",
            "MOHAMED TICH TICH ABDERREZAK",
            "REGAB AMMAR",
            "SALHI  WALID",
            "SALHI SAMI",
            "Sanchez y Sanchez Spa",
            "SARL ACOSCO",
            "SARL AGGLOLUX",
            "SARL AL FURAT SERVICES PUBLICS",
            "SARL AL MOUDAYNA HOTEL",
            "SARL ALLAL DISTRIBUTION",
            "SARL ALMAFRIQUE",
            "SARL AXEL DISTRIBUTION",
            "SARL AZ MARKET",
            "SARL BELSAL",
            "SARL CESAREE INTERCONTINENTAL",
            "SARL DIS SAM SUFFIT",
            "SARL DISTRI SMARTAN",
            "SARL DJAZAIR BEST FOOD",
            "SARL DRINK FOR EVER",
            "SARL EL HAMIZ GRO ALIMENTAIRE",
            "SARL EL IKHWA DEBABHA WA CHORAKAIH",
            "SARL EL MIZANIA COMMERCE",
            "SARL ELIKHWA BENMERBI LITAWZIA",
            "SARL EURO JAPAN RESIDENCE",
            "SARL FATH EL ANDALOUS RESTAURANT",
            "SARL FINEX TRADING",
            "SARL FOUR WEEKS",
            "SARL FT DRINK",
            "SARL GROUPE KAF EL NADHOUR",
            "SARL GROUPE LAAMIDI WA ABNAIH",
            "SARL HORECA ALGERIE",
            "SARL IMAGINE AND DREAM",
            "SARL JAGEBU SERVICE COMPANY",
            "SARL KIELIUS DISTRIBUTION",
            "SARL LA POINTE DISTRIBUTION",
            "SARL LABEL MEDITERRANEAN CATERING",
            "SARL LARGE DISTRIBUTION",
            "SARL LOUDJINE DISTRIBUTION",
            "SARL M S EL ISRAA",
            "SARL METROPOLIS DISTRIBUTION",
            "SARL MOKRANE ALI BOISSON",
            "SARL MULTI CATERING ALGERIA",
            "SARL NEWREST REMOTE ALGERIE",
            "SARL NOMADIS AGRO ALIMENTAIRE",
            "SARL NOVA TRADE",
            "SARL RAHMA DISTRIBUTION",
            "SARL RENOMA FOOD",
            "SARL SIFAR DISTRIBUTION",
            "SARL SIFAR DISTRIBUTION_Djelfa",
            "SARL SOCIETE CIEPTAL CATERING",
            "SARL SODI FAST",
            "SARL SUD PRIM",
            "SARL SUPERETTE ASSILA COMMERCE",
            "SARL THALLADIS -AIN TEMOUCHENT-",
            "SARL THALLADIS -TLEMCEN-",
            "SARL THURTHITS",
            "SARL UNITED DRINK AND FOOD",
            "SARL UNIVERSAL CATERING SERVICES",
            "SARL VICTORIA DISTRIBITION",
            "SASSI MILOUD",
            "SAYAGRO.INC",
            "Seven Seven Co Ltd",
            "SNC BENKHAOUA DRINK",
            "SNC IBRAHIM FRERES LA VALLEE DE LA",
            "SNC IBRAHIM KARIM ET FRERES",
            "SNC METNA & FRERES",
            "SNC MOUSSAOUI ET FRERES - TAFRADHA",
            "SNC TRANSPORT MARCHANDISES IBRAHIM",
            "SNC WIN WIN COMPANY AMRANE",
            "SOCIETE HAWA N'DIAYE ET FILS -SARL",
            "SODEXO ALGERIE",
            "SOLTANE BILAL",
            "SOLTANE DERRADJI",
            "SOUMIA HADRI",
            "SPA /EPE STE NATIONALE DES TRAVAUX",
            "SPA AL SHARIKA EL DJAZAIRIA",
            "SPA ALGERIE LIGABUE CATERING ALC",
            "SPA BAYAT CATRING",
            "SPA COSIDER CANALISATIONS",
            "SPA E G T G",
            "SPA EGT ANNABA",
            "SPA ENTREPRISE DE GESTION HOTELIERE",
            "SPA H.D.A HYPER DISTRIBUTION ALGERI",
            "SPA HORES HEBERGEMENT RESTAURATION",
            "SPA RAIL SERVICES",
            "SPA RHEINMETALL ALGERIE",
            "SPA SHIFABE",
            "SPA SOCIETE D'INFRASTRUCTURES AQUA",
            "SPA TASSILI AIRLINES",
            "SPA TOSYALI IRONSTEEL INDUSTRY",
            "SPA TRUST REAL ESTATE",
            "SPA UNODIS",
            "SURETE W BBA",
            "TOUATI SOUFIANE",
            "WERLINEZ LTD",
            "WILAYA DE KHENCHELA",
            "YAHIAOUI YASSINE",
            "YAHIAOUI YASSINE -Adrar",
            "YAHIAOUI YASSINE -ILLIZI-",
            "YAHIAOUI YASSINE -Tizi ouzou-",
            "YAHIAOUI YASSINE_Ouargla",
            "ZIDANI OUKIL"
        ];

        for client in &clients {
            sqlx::query(
                "INSERT INTO clients (id, name) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING"
            )
            .bind(Uuid::new_v4())
            .bind(client.trim())
            .execute(pool)
            .await?;
        }
        println!("Inserted initial client data");
    }

    // Create nc_des table for description types
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS nc_des (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Insert default description types if they don't exist
    let description_types = ["Physique", "Chimique", "Biologique", "Process"];
    
    for desc_type in &description_types {
        sqlx::query(
            r#"
            INSERT INTO nc_des (name)
            VALUES ($1)
            ON CONFLICT (name) DO NOTHING
            "#,
        )
        .bind(desc_type)
        .execute(pool)
        .await?;
    }

    // Create indexes
    let index_queries = [
        "CREATE INDEX IF NOT EXISTS idx_non_conformity_reports_report_number ON non_conformity_reports (report_number)",
        "CREATE INDEX IF NOT EXISTS idx_non_conformity_reports_line_id ON non_conformity_reports (line_id)",
        "CREATE INDEX IF NOT EXISTS idx_non_conformity_reports_product_id ON non_conformity_reports (product_id)",
        "CREATE INDEX IF NOT EXISTS idx_non_conformity_reports_status ON non_conformity_reports (status)",
        "CREATE INDEX IF NOT EXISTS idx_non_conformity_reports_report_date ON non_conformity_reports (report_date)"
    ];

    for query in &index_queries {
        if let Err(e) = sqlx::query(*query).execute(pool).await {
            eprintln!("Error creating index: {}", e);
            // Continue with other indexes even if one fails
        }
    }

    // Create initial admin user if it doesn't exist
    if let Err(e) = create_initial_admin_user(pool).await {
        eprintln!("Error creating admin user: {}", e);
        // Continue even if admin user creation fails
    }

    // Create some sample data
    if let Err(e) = create_sample_data(pool).await {
        eprintln!("Error creating sample data: {}", e);
        // Continue even if sample data creation fails
    }

    Ok(())
}

async fn create_initial_admin_user(pool: &PgPool) -> Result<()> {
    // Check if admin user already exists
    let existing_admin: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM users WHERE username = $1"
    )
    .bind("admin")
    .fetch_one(pool)
    .await?;

    if existing_admin == 0 {
        // Create admin user
        let user_id = Uuid::new_v4();
        let username = "admin";
        let password = "admin123"; // In production, use a more secure password
        let password_hash = hash(password, DEFAULT_COST)?;
        let role = "admin";
        let now = Utc::now();

        sqlx::query(
            "INSERT INTO users (id, username, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)"
        )
        .bind(user_id)
        .bind(username)
        .bind(password_hash)
        .bind(role)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await?;

        println!("Created initial admin user: username=admin, password=admin123");
    } else {
        println!("Admin user already exists, skipping creation");
    }

    Ok(())
}

async fn create_sample_data(pool: &PgPool) -> Result<()> {
    // Check if sample data already exists
    let existing_lines: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM production_lines"
    )
    .fetch_one(pool)
    .await?;

    if existing_lines == 0 {
        let now = Utc::now();
        
        // Insert production lines
        let production_lines = [
            "COMBI 20",
            "K-MIXTE",
            "CANETTE",
            "TETRA 1000",
            "KSB18-33",
            "TETRA speed",
            "KSB18-2",
            "KSB 301",
            "KSB 6",
            "MATRIX",
            "CSD",
            "SASIB",
            "ASEPTIQUE",
            "Saida",
            "KRV40",
            "KSB 20",
            "TETRA 330",
            "TETRA 330/02",
            "ARWA",
            "TETRA 200"
        ];

        for line_name in &production_lines {
            let line_id = Uuid::new_v4();
            sqlx::query(
                "INSERT INTO production_lines (id, name, description, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)"
            )
            .bind(line_id)
            .bind(line_name.trim())
            .bind("")
            .bind(true)
            .bind(now)
            .bind(now)
            .execute(pool)
            .await?;
        }

        // Insert sample products
        let products = [
            "Izem coco",
            "Boisson pomme fraise au lait",
            "Izem",
            "Boisson pomme banane au lait",
            "Jus raisin 100%",
            "Boisson raisin cerise",
            "Soda framboise",
            "Citronnade -30%",
            "Boisson pêche abricot",
            "Boisson pomme mangue kids",
            "Izem Poire",
            "Jus pomme 100%",
            "Boisson Pomme Orange kids",
            "Boisson orange carotte citron",
            "Soda orange",
            "Izem 0%",
            "Boisson Orange Ananas au Lait",
            "Izem fruits rouge",
            "Tropical",
            "Soda bitter",
            "Boisson fruits rouge au lait",
            "Boisson orange",
            "Boisson orange mangue au lait",
            "Soda pomme noire",
            "Soda pomme verte",
            "Izem fraise abricot",
            "Soda agrume",
            "Soda ananas",
            "Jus mandarine 100%",
            "Izem tropical",
            "Soda citron",
            "Citronnade",
            "Soda citron jaune",
            "Izem Tropical",
            "Boisson pomme kids",
            "Izem cerise",
            "Boisson pomme mangue",
            "Boisson orange ananas",
            "Boisson raisin mûre",
            "Jus raisin blanc 100%",
            "Izem mangue",
            "Izem figue",
            "citronnade -30%",
            "Boisson cocktail kids",
            "Citronnade menthe",
            "Izem poire",
            "Izem pastèque",
            "Boisson raisin mure au lait",
            "Boisson pêche orange",
            "Jus orange 100%",
            "Boisson pomme fraise kids"
        ];

        for (index, product_name) in products.iter().enumerate() {
            let product_id = Uuid::new_v4();
            let code = format!("PROD-{:04}", index + 1);
            
            sqlx::query(
                "INSERT INTO products (id, designation, code, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)"
            )
            .bind(product_id)
            .bind(product_name.trim())
            .bind(code)
            .bind(now)
            .bind(now)
            .execute(pool)
            .await?;
        }

        println!("Created sample production data with {} products", products.len());
    }

    Ok(())
}
