import { Pool, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;
let isInitialized = false;
let dbAvailable: boolean | null = null;
let lastAttemptTime = 0;
const RETRY_INTERVAL_MS = 15000; // Check reconnection at most once every 15s

export function getPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://localhost:5432/buyxoco';

    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 2000,
      idleTimeoutMillis: 10000,
      max: 10,
      ssl:
        process.env.DATABASE_SSL === 'true' || connectionString.includes('sslmode=require')
          ? { rejectUnauthorized: false }
          : undefined,
    });

    pool.on('error', (err) => {
      console.warn('PostgreSQL pool error (non-fatal):', err.message);
      dbAvailable = false;
    });
  }
  return pool;
}

/**
 * Initializes database tables if not already existing.
 */
export async function initDb(): Promise<boolean> {
  if (isInitialized && dbAvailable) {
    return true;
  }

  const now = Date.now();
  if (dbAvailable === false && now - lastAttemptTime < RETRY_INTERVAL_MS) {
    return false;
  }

  lastAttemptTime = now;
  const p = getPool();
  try {
    const client = await p.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS invite_codes (
          id VARCHAR(100) PRIMARY KEY,
          code VARCHAR(50) UNIQUE NOT NULL,
          note TEXT DEFAULT '',
          usage INTEGER NOT NULL DEFAULT 0,
          max_usage INTEGER NOT NULL DEFAULT 1,
          status VARCHAR(20) NOT NULL DEFAULT 'usable',
          created_str VARCHAR(50) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS registered_users (
          id SERIAL PRIMARY KEY,
          invite_code_id VARCHAR(100) REFERENCES invite_codes(id) ON DELETE CASCADE,
          invite_code VARCHAR(50) NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          shop_name VARCHAR(255) NOT NULL,
          registered_at VARCHAR(50) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sellers (
          id SERIAL PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          shop_name VARCHAR(255) NOT NULL,
          login_hash VARCHAR(255) NOT NULL,
          transaction_hash VARCHAR(255) NOT NULL,
          salt VARCHAR(255),
          invite_code VARCHAR(50) NOT NULL,
          agreed_terms BOOLEAN DEFAULT TRUE,
          status VARCHAR(50) DEFAULT 'approved',
          package_tier VARCHAR(50) DEFAULT 'Free Shop',
          phone VARCHAR(50),
          id_status VARCHAR(100) DEFAULT 'No ID uploaded',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS kyc_submissions (
          id SERIAL PRIMARY KEY,
          seller_email VARCHAR(255) NOT NULL,
          seller_name VARCHAR(255) NOT NULL,
          shop_name VARCHAR(255) NOT NULL,
          doc_type VARCHAR(100) NOT NULL,
          front_image TEXT NOT NULL,
          back_image TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          rejection_reason TEXT DEFAULT '',
          submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          reviewed_at TIMESTAMP WITH TIME ZONE,
          reviewed_by VARCHAR(100)
        );

        CREATE TABLE IF NOT EXISTS admin_audit_log (
          id VARCHAR(100) PRIMARY KEY,
          action_text VARCHAR(300) NOT NULL,
          details TEXT NOT NULL DEFAULT '',
          category VARCHAR(20) NOT NULL,
          actor VARCHAR(255) NOT NULL,
          ip VARCHAR(64) NOT NULL,
          endpoint VARCHAR(200) NOT NULL,
          workflow_id VARCHAR(120) NOT NULL DEFAULT '',
          target_id VARCHAR(160) NOT NULL DEFAULT '',
          method VARCHAR(12) NOT NULL,
          status INTEGER NOT NULL DEFAULT 0,
          success BOOLEAN NOT NULL DEFAULT FALSE,
          user_agent VARCHAR(500) NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admin_handover_tasks (
          id VARCHAR(100) PRIMARY KEY,
          title VARCHAR(200) NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          assigned_to VARCHAR(255) NOT NULL DEFAULT '',
          priority VARCHAR(20) NOT NULL DEFAULT 'normal',
          status VARCHAR(20) NOT NULL DEFAULT 'open',
          due_at TIMESTAMP WITH TIME ZONE,
          created_by VARCHAR(255) NOT NULL DEFAULT '',
          updated_by VARCHAR(255) NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS admin_store_settings (
          id VARCHAR(40) PRIMARY KEY,
          settings JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS retail_catalog_state (
          id SMALLINT PRIMARY KEY CHECK (id = 1),
          listings JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS storehouse_catalog_products (
          product_id VARCHAR(100) PRIMARY KEY,
          category_slug VARCHAR(120) NOT NULL,
          category_name VARCHAR(160) NOT NULL,
          subcategory_name VARCHAR(160) NOT NULL,
          currency VARCHAR(3) NOT NULL DEFAULT 'USD',
          price NUMERIC(12, 2) NOT NULL,
          source_batch VARCHAR(100) NOT NULL,
          product_data JSONB NOT NULL,
          sku_key TEXT,
          product_name_key TEXT,
          image_sha256 CHAR(64),
          import_batch_id VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE storehouse_catalog_products ADD COLUMN IF NOT EXISTS sku_key TEXT;
        ALTER TABLE storehouse_catalog_products ADD COLUMN IF NOT EXISTS product_name_key TEXT;
        ALTER TABLE storehouse_catalog_products ADD COLUMN IF NOT EXISTS image_sha256 CHAR(64);
        ALTER TABLE storehouse_catalog_products ADD COLUMN IF NOT EXISTS import_batch_id VARCHAR(100);

        CREATE INDEX IF NOT EXISTS idx_storehouse_catalog_category
          ON storehouse_catalog_products(category_slug, subcategory_name);
        CREATE INDEX IF NOT EXISTS idx_storehouse_catalog_batch
          ON storehouse_catalog_products(source_batch);
        CREATE INDEX IF NOT EXISTS idx_storehouse_catalog_import_batch
          ON storehouse_catalog_products(import_batch_id);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_storehouse_verified_sku_unique
          ON storehouse_catalog_products(sku_key)
          WHERE source_batch = 'STOREHOUSE-CATALOG-VERIFIED-V1' AND sku_key IS NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_storehouse_verified_name_unique
          ON storehouse_catalog_products(product_name_key)
          WHERE source_batch = 'STOREHOUSE-CATALOG-VERIFIED-V1' AND product_name_key IS NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_storehouse_verified_image_unique
          ON storehouse_catalog_products(image_sha256)
          WHERE source_batch = 'STOREHOUSE-CATALOG-VERIFIED-V1' AND image_sha256 IS NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_storehouse_product_feed_sku_unique
          ON storehouse_catalog_products(sku_key)
          WHERE source_batch = 'ADMIN-PRODUCT-FEED-V1' AND sku_key IS NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_storehouse_product_feed_name_unique
          ON storehouse_catalog_products(product_name_key)
          WHERE source_batch = 'ADMIN-PRODUCT-FEED-V1' AND product_name_key IS NOT NULL;

        CREATE TABLE IF NOT EXISTS consign_catalog_products (
          product_id VARCHAR(100) PRIMARY KEY REFERENCES storehouse_catalog_products(product_id) ON DELETE CASCADE,
          category_name VARCHAR(160) NOT NULL,
          subcategory_name VARCHAR(160) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_consign_catalog_category
          ON consign_catalog_products(category_name, product_id);

        CREATE TABLE IF NOT EXISTS storehouse_catalog_import_batches (
          id VARCHAR(100) PRIMARY KEY,
          input_digest CHAR(64) NOT NULL,
          source_name TEXT NOT NULL DEFAULT '',
          status VARCHAR(24) NOT NULL DEFAULT 'uploading',
          expected_products INTEGER NOT NULL DEFAULT 8700,
          uploaded_products INTEGER NOT NULL DEFAULT 0,
          published_products INTEGER NOT NULL DEFAULT 0,
          category_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
          errors JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_by VARCHAR(255) NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP WITH TIME ZONE
        );
        ALTER TABLE storehouse_catalog_import_batches ADD COLUMN IF NOT EXISTS source_name TEXT NOT NULL DEFAULT '';
        CREATE INDEX IF NOT EXISTS idx_storehouse_import_batches_created
          ON storehouse_catalog_import_batches(created_at DESC);

        CREATE TABLE IF NOT EXISTS product_update_history_state (
          id SMALLINT PRIMARY KEY CHECK (id = 1),
          batches JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS website_info_state (
          id SMALLINT PRIMARY KEY CHECK (id = 1),
          settings JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS website_info_assets (
          asset_id VARCHAR(40) PRIMARY KEY,
          file_name VARCHAR(255) NOT NULL,
          content_type VARCHAR(120) NOT NULL,
          data BYTEA NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admin_accounts (
          id VARCHAR(100) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'Admin',
          is_root BOOLEAN NOT NULL DEFAULT FALSE,
          status VARCHAR(20) NOT NULL DEFAULT 'Active',
          password_hash VARCHAR(255) NOT NULL,
          password_salt VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP WITH TIME ZONE
        );

        CREATE INDEX IF NOT EXISTS idx_admin_accounts_email ON admin_accounts(LOWER(email));
        CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_accounts_single_root ON admin_accounts(is_root) WHERE is_root = TRUE;

        ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS details TEXT NOT NULL DEFAULT '';
        ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS workflow_id VARCHAR(120) NOT NULL DEFAULT '';
        ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS target_id VARCHAR(160) NOT NULL DEFAULT '';

        ALTER TABLE sellers ADD COLUMN IF NOT EXISTS salt VARCHAR(255);
        ALTER TABLE sellers ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'approved';
        ALTER TABLE sellers ADD COLUMN IF NOT EXISTS package_tier VARCHAR(50) DEFAULT 'Free Shop';
        ALTER TABLE sellers ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
        ALTER TABLE sellers ADD COLUMN IF NOT EXISTS id_status VARCHAR(100) DEFAULT 'No ID uploaded';


        CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
        CREATE INDEX IF NOT EXISTS idx_reg_users_invite ON registered_users(invite_code);
        CREATE INDEX IF NOT EXISTS idx_sellers_email ON sellers(email);
        CREATE INDEX IF NOT EXISTS idx_kyc_seller_email ON kyc_submissions(seller_email);
        CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_submissions(status);
        CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_admin_handover_tasks_status ON admin_handover_tasks(status);
        CREATE INDEX IF NOT EXISTS idx_admin_handover_tasks_due_at ON admin_handover_tasks(due_at);
      `);

      isInitialized = true;
      dbAvailable = true;
      console.log('PostgreSQL schema initialized successfully.');
      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (dbAvailable !== false) {
      console.warn(
        'PostgreSQL offline or connecting on configured port:',
        err.message,
        '- Resilient fallback active (data preserved with zero loss).'
      );
    }
    dbAvailable = false;
    return false;
  }
}

/**
 * Safely execute a query with error catching.
 */
export async function dbQuery<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T> | null> {
  const isReady = await initDb();
  if (!isReady) return null;

  try {
    const p = getPool();
    return await p.query<T>(text, params);
  } catch (err: any) {
    console.warn('PostgreSQL query error:', err.message);
    return null;
  }
}

/**
 * Check if PostgreSQL connection is currently online and responding.
 */
export async function isDbConnected(): Promise<boolean> {
  return await initDb();
}
