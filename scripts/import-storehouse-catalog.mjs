import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const { Pool } = pg;
const categoryNames = JSON.parse(fsSync.readFileSync(path.resolve('src/data/storehouseImportCategoryNames.json'), 'utf8'));
const TARGET_PER_CATEGORY = 300;
const EXPECTED_TOTAL = categoryNames.length * TARGET_PER_CATEGORY;
const VERIFIED_BATCH = 'STOREHOUSE-CATALOG-VERIFIED-V1';
const CHUNK_SIZE = 500;
const MIN_IMAGE_EDGE = 600;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

function fail(message) {
  throw new Error(message);
}

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const envText = fsSync.readFileSync(path.resolve('.env.local'), 'utf8');
    const line = envText.split(/\r?\n/).find((item) => /^\s*DATABASE_URL\s*=/.test(item));
    if (line) {
      const value = line.slice(line.indexOf('=') + 1).trim();
      if (value.length >= 2 && ((value[0] === '"' && value.at(-1) === '"') || (value[0] === "'" && value.at(-1) === "'"))) {
        return value.slice(1, -1);
      }
      return value;
    }
  } catch {}
  return 'postgresql://localhost:5432/buyxoco';
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(value);
      value = '';
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
    } else value += char;
  }
  if (quoted) fail('The CSV has an unclosed quoted field.');
  if (value.length || row.length) {
    row.push(value);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }
  if (rows.length < 2) fail('The CSV needs a header and product rows.');
  const headers = rows.shift().map((header) => normalizeHeader(header));
  if (new Set(headers).size !== headers.length) fail('The CSV contains duplicate column headers.');
  return rows.map((cells, index) => {
    if (cells.length !== headers.length) fail(`CSV row ${index + 2} has ${cells.length} columns; expected ${headers.length}.`);
    return Object.fromEntries(headers.map((header, column) => [header, String(cells[column] ?? '').trim()]));
  });
}

function normalizeHeader(value) {
  return String(value).replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function categorySlug(name) {
  return String(name).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function parseJpegSize(bytes) {
  let offset = 2;
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    const segmentLength = bytes.readUInt16BE(offset + 2);
    if (sofMarkers.has(marker)) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7), format: 'jpg' };
    }
    if (segmentLength < 2) break;
    offset += segmentLength + 2;
  }
  return null;
}

function parseImageSize(bytes) {
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), format: 'png' };
  }
  if (bytes.length >= 30 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = bytes.toString('ascii', 12, 16);
    if (chunk === 'VP8X') {
      const width = 1 + bytes.readUIntLE(24, 3);
      const height = 1 + bytes.readUIntLE(27, 3);
      return { width, height, format: 'webp' };
    }
    if (chunk === 'VP8L' && bytes[20] === 0x2f) {
      const width = 1 + (((bytes[22] & 0x3f) << 8) | bytes[21]);
      const height = 1 + (((bytes[23] & 0x0f) << 10) | (bytes[22] << 2) | ((bytes[21] & 0xc0) >> 6));
      return { width, height, format: 'webp' };
    }
    if (chunk === 'VP8 ' && bytes.toString('hex', 23, 26) === '9d012a') {
      return {
        width: bytes.readUInt16LE(26) & 0x3fff,
        height: bytes.readUInt16LE(28) & 0x3fff,
        format: 'webp',
      };
    }
  }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) return parseJpegSize(bytes);
  return null;
}

function readField(row, ...aliases) {
  for (const alias of aliases) {
    const value = row[normalizeHeader(alias)];
    if (value) return value.trim();
  }
  return '';
}

async function resolveImage(imageRoot, relativePath, rowNumber) {
  if (!relativePath) fail(`CSV row ${rowNumber}: image_file is required.`);
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\.\//, '');
  if (path.isAbsolute(normalized) || normalized.split('/').some((part) => part === '..')) {
    fail(`CSV row ${rowNumber}: image_file must be a relative path inside the image folder.`);
  }
  const absolute = path.resolve(imageRoot, normalized);
  const root = path.resolve(imageRoot) + path.sep;
  if (!absolute.startsWith(root)) fail(`CSV row ${rowNumber}: image_file escapes the selected image folder.`);
  let bytes;
  try { bytes = await fs.readFile(absolute); }
  catch { fail(`CSV row ${rowNumber}: image file not found: ${normalized}`); }
  if (bytes.length < 2048) fail(`CSV row ${rowNumber}: image is too small or empty (${normalized}).`);
  if (bytes.length > MAX_IMAGE_BYTES) fail(`CSV row ${rowNumber}: image exceeds the 12 MB limit (${normalized}).`);
  const dimensions = parseImageSize(bytes);
  if (!dimensions) fail(`CSV row ${rowNumber}: use a valid PNG, JPEG, or WebP product image (${normalized}).`);
  if (dimensions.width < MIN_IMAGE_EDGE || dimensions.height < MIN_IMAGE_EDGE) {
    fail(`CSV row ${rowNumber}: image must be at least ${MIN_IMAGE_EDGE}×${MIN_IMAGE_EDGE} (${normalized} is ${dimensions.width}×${dimensions.height}).`);
  }
  return { dimensions, hash: sha256(bytes), relative: normalized };
}

async function validateRows(rawRows, imageRoot) {
  const categories = new Map(categoryNames.map((name) => [normalizeKey(name), { name, slug: categorySlug(name), count: 0 }]));
  const seenSkus = new Set();
  const seenNames = new Set();
  const seenImageHashes = new Set();
  const prepared = [];
  const categoryCounts = Object.fromEntries(categoryNames.map((name) => [categorySlug(name), 0]));

  for (let index = 0; index < rawRows.length; index += 1) {
    const row = rawRows[index];
    const rowNumber = index + 2;
    const categoryNameInput = readField(row, 'category', 'category_name');
    const category = categories.get(normalizeKey(categoryNameInput));
    if (!category) fail(`CSV row ${rowNumber}: unknown category "${categoryNameInput}".`);

    const sku = readField(row, 'sku', 'seller_sku', 'product_sku').trim();
    const title = readField(row, 'title', 'product_name', 'name').trim();
    const subcategory = readField(row, 'subcategory', 'sub_category').trim();
    const description = readField(row, 'description', 'product_description').trim();
    const brand = readField(row, 'brand', 'company') || 'Unbranded';
    const imageFile = readField(row, 'image_file', 'image_filename', 'image_path');
    const price = Number(readField(row, 'price_usd', 'usd_price', 'price'));
    const originalValue = readField(row, 'original_price_usd', 'compare_at_price_usd', 'original_price');
    const originalPrice = originalValue ? Number(originalValue) : price;
    const stockValue = readField(row, 'stock_quantity', 'stock', 'inventory');
    const stockQuantity = Number(stockValue);
    const sourceUrl = readField(row, 'source_url', 'product_url');
    const attributesRaw = readField(row, 'attributes_json', 'specifications_json', 'attributes');
    const keywords = readField(row, 'keywords', 'search_keywords');

    if (!sku || sku.length > 100) fail(`CSV row ${rowNumber}: SKU is required and must be under 100 characters.`);
    if (!title || title.length < 4 || title.length > 240 || /^(product|item|test|demo)(\s*\d+)?$/i.test(title)) {
      fail(`CSV row ${rowNumber}: provide a meaningful product title.`);
    }
    if (!subcategory) fail(`CSV row ${rowNumber}: subcategory is required.`);
    if (description.length < 20) fail(`CSV row ${rowNumber}: description must be at least 20 characters.`);
    if (!Number.isFinite(price) || price <= 0 || price > 1_000_000) fail(`CSV row ${rowNumber}: price_usd must be a positive USD price.`);
    if (!Number.isFinite(originalPrice) || originalPrice < price || originalPrice > 1_000_000) {
      fail(`CSV row ${rowNumber}: original_price_usd must be blank or at least price_usd.`);
    }
    if (!stockValue || !Number.isInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 10_000_000) {
      fail(`CSV row ${rowNumber}: stock_quantity must be a non-negative whole number.`);
    }
    if (sourceUrl) {
      let parsed;
      try { parsed = new URL(sourceUrl); } catch { fail(`CSV row ${rowNumber}: source_url must be a valid HTTPS URL.`); }
      if (parsed.protocol !== 'https:') fail(`CSV row ${rowNumber}: source_url must use HTTPS.`);
    }

    let attributes = {};
    if (attributesRaw) {
      try { attributes = JSON.parse(attributesRaw); } catch { fail(`CSV row ${rowNumber}: attributes_json is not valid JSON.`); }
      if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) {
        fail(`CSV row ${rowNumber}: attributes_json must be a JSON object.`);
      }
      if (Object.values(attributes).some((value) => value !== null && typeof value === 'object')) {
        fail(`CSV row ${rowNumber}: attributes_json values must be text or numbers.`);
      }
    }

    const skuKey = sku.toUpperCase().trim();
    const nameKey = normalizeKey(title);
    if (seenSkus.has(skuKey)) fail(`CSV row ${rowNumber}: duplicate SKU "${sku}".`);
    if (seenNames.has(nameKey)) fail(`CSV row ${rowNumber}: duplicate product name "${title}".`);
    seenSkus.add(skuKey);
    seenNames.add(nameKey);

    const image = await resolveImage(imageRoot, imageFile, rowNumber);
    if (seenImageHashes.has(image.hash)) fail(`CSV row ${rowNumber}: duplicate image content (${image.relative}).`);
    seenImageHashes.add(image.hash);

    category.count += 1;
    categoryCounts[category.slug] += 1;
    const productId = `catalog-${sha256(Buffer.from(skuKey)).slice(0, 32)}`;
    const slug = normalizeKey(title).replace(/\s+/g, '-');
    const extension = image.dimensions.format === 'jpg' ? 'jpg' : image.dimensions.format;
    const mainImage = `/images/storehouse-catalog/${image.hash}.${extension}`;
    const statusValue = readField(row, 'status').toLowerCase();
    const status = stockQuantity === 0
      ? 'Limited Availability'
      : statusValue === 'low stock' || stockQuantity < 25
        ? 'Low Stock'
        : 'In Stock';
    const conditionInput = readField(row, 'condition') || 'Brand New';
    const validConditions = new Set(['Brand New', 'Factory Sealed', 'Open Box - Like New', 'Refurbished Grade A']);
    if (!validConditions.has(conditionInput)) fail(`CSV row ${rowNumber}: unsupported condition "${conditionInput}".`);

    prepared.push({
      productId,
      sku,
      skuKey,
      nameKey,
      imageSha256: image.hash,
      imageRelative: image.relative,
      imageExtension: extension,
      category: category.name,
      categorySlug: category.slug,
      subcategory,
      title,
      brand,
      description,
      price,
      originalPrice,
      stockQuantity,
      status,
      condition: conditionInput,
      sourceUrl,
      keywords: keywords.split(/[|;]/).map((keyword) => keyword.trim()).filter(Boolean),
      attributes: Object.fromEntries(Object.entries(attributes).map(([key, value]) => [key, String(value)])),
      mainImage,
      productData: {
        id: productId,
        title,
        slug,
        sku,
        shortDescription: description.slice(0, 180),
        description,
        category: category.name,
        categorySlug: category.slug,
        subcategory,
        brand,
        price,
        compareAtPrice: originalPrice,
        currency: 'USD',
        stockQuantity,
        minOrderQuantity: 1,
        condition: conditionInput,
        status,
        mainImage,
        galleryImages: [mainImage],
        attributes: {
          ...Object.fromEntries(Object.entries(attributes).map(([key, value]) => [key, String(value)])),
          ...(sourceUrl ? { 'Product Source': sourceUrl } : {}),
          'Image SHA-256': image.hash,
          ...(keywords ? { 'Search Keywords': keywords } : {}),
        },
        rating: 0,
        reviewCount: 0,
        isDemo: false,
        demoBatch: VERIFIED_BATCH,
      },
    });
  }

  if (prepared.length !== EXPECTED_TOTAL) fail(`Expected exactly ${EXPECTED_TOTAL} rows; CSV contains ${prepared.length}.`);
  const wrongCounts = Object.entries(categoryCounts).filter(([, count]) => count !== TARGET_PER_CATEGORY);
  if (wrongCounts.length) {
    fail(`Every category must have exactly ${TARGET_PER_CATEGORY} products. Incorrect counts: ${wrongCounts.map(([slug, count]) => `${slug}=${count}`).join(', ')}.`);
  }

  return { prepared, categoryCounts };
}

async function ensureDatabase(client) {
  await client.query(`
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE storehouse_catalog_products ADD COLUMN IF NOT EXISTS sku_key TEXT;
    ALTER TABLE storehouse_catalog_products ADD COLUMN IF NOT EXISTS product_name_key TEXT;
    ALTER TABLE storehouse_catalog_products ADD COLUMN IF NOT EXISTS image_sha256 CHAR(64);
    ALTER TABLE storehouse_catalog_products ADD COLUMN IF NOT EXISTS import_batch_id VARCHAR(100);
    CREATE INDEX IF NOT EXISTS idx_storehouse_catalog_import_batch ON storehouse_catalog_products(import_batch_id);
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMPTZ
    );
    ALTER TABLE storehouse_catalog_import_batches ADD COLUMN IF NOT EXISTS source_name TEXT NOT NULL DEFAULT '';
    CREATE INDEX IF NOT EXISTS idx_storehouse_import_batches_created ON storehouse_catalog_import_batches(created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_storehouse_verified_sku_unique
      ON storehouse_catalog_products(sku_key)
      WHERE source_batch = '${VERIFIED_BATCH}' AND sku_key IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_storehouse_verified_name_unique
      ON storehouse_catalog_products(product_name_key)
      WHERE source_batch = '${VERIFIED_BATCH}' AND product_name_key IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_storehouse_verified_image_unique
      ON storehouse_catalog_products(image_sha256)
      WHERE source_batch = '${VERIFIED_BATCH}' AND image_sha256 IS NOT NULL;
  `);
}

async function refreshBatchCounts(pool, batchId) {
  const result = await pool.query(
    `SELECT category_slug, COUNT(*)::int AS count
     FROM storehouse_catalog_products
     WHERE import_batch_id = $1
     GROUP BY category_slug`,
    [batchId]
  );
  const counts = Object.fromEntries(categoryNames.map((name) => [categorySlug(name), 0]));
  result.rows.forEach((row) => { counts[row.category_slug] = row.count; });
  const uploaded = Object.values(counts).reduce((sum, count) => sum + count, 0);
  await pool.query(
    `UPDATE storehouse_catalog_import_batches
     SET uploaded_products = $2, category_counts = $3::jsonb, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [batchId, uploaded, JSON.stringify(counts)]
  );
  return { uploaded, counts };
}

async function importDataset({ csvPath, imageRoot, pool }) {
  const csvBytes = await fs.readFile(csvPath);
  const rawRows = parseCsv(csvBytes.toString('utf8'));
  const { prepared, categoryCounts } = await validateRows(rawRows, imageRoot);
  const inputDigest = sha256(Buffer.concat([csvBytes, Buffer.from(prepared.map((row) => row.imageSha256).join(''))]));
  const batchId = inputDigest.slice(0, 40);
  const stagedBatch = `STOREHOUSE-CATALOG-STAGED-${batchId}`;
  const sourceName = path.basename(csvPath);

  const previous = await pool.query('SELECT status, input_digest FROM storehouse_catalog_import_batches WHERE id = $1', [batchId]);
  if (previous.rowCount && previous.rows[0].input_digest.trim() !== inputDigest) {
    fail('Import batch identifier is already associated with different source data.');
  }
  if (previous.rowCount && previous.rows[0].status === 'completed') {
    console.log(`This exact dataset is already imported: ${batchId}`);
    return;
  }

  const publishedDuplicates = await pool.query(
    `SELECT sku_key, product_name_key, image_sha256
     FROM storehouse_catalog_products
     WHERE source_batch = $1 AND import_batch_id IS DISTINCT FROM $2`,
    [VERIFIED_BATCH, batchId]
  );
  const knownSkus = new Set(publishedDuplicates.rows.map((row) => row.sku_key));
  const knownNames = new Set(publishedDuplicates.rows.map((row) => row.product_name_key));
  const knownImages = new Set(publishedDuplicates.rows.map((row) => row.image_sha256?.trim()));
  for (const row of prepared) {
    if (knownSkus.has(row.skuKey)) fail(`SKU already exists in the published catalog: ${row.sku}.`);
    if (knownNames.has(row.nameKey)) fail(`Product name already exists in the published catalog: ${row.title}.`);
    if (knownImages.has(row.imageSha256)) fail(`Image content already exists in the published catalog for SKU ${row.sku}.`);
  }

  await pool.query(
    `INSERT INTO storehouse_catalog_import_batches (id, input_digest, source_name, status, expected_products, created_by)
     VALUES ($1, $2, $3, 'uploading', $4, $5)
     ON CONFLICT (id) DO UPDATE SET source_name = EXCLUDED.source_name, status = 'uploading', errors = '[]'::jsonb, updated_at = CURRENT_TIMESTAMP`,
    [batchId, inputDigest, sourceName, EXPECTED_TOTAL, process.env.USERNAME || process.env.USER || 'local-admin']
  );

  for (let start = 0; start < prepared.length; start += CHUNK_SIZE) {
    const chunk = prepared.slice(start, start + CHUNK_SIZE);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insertRows = chunk.map((row) => ({
        product_id: row.productId,
        category_slug: row.categorySlug,
        category_name: row.category,
        subcategory_name: row.subcategory,
        currency: 'USD',
        price: row.price,
        source_batch: stagedBatch,
        product_data: row.productData,
        sku_key: row.skuKey,
        product_name_key: row.nameKey,
        image_sha256: row.imageSha256,
        import_batch_id: batchId,
      }));
      const inserted = await client.query(
        `INSERT INTO storehouse_catalog_products (
           product_id, category_slug, category_name, subcategory_name, currency, price,
           source_batch, product_data, sku_key, product_name_key, image_sha256, import_batch_id, updated_at
         )
         SELECT product_id, category_slug, category_name, subcategory_name, currency, price,
                source_batch, product_data, sku_key, product_name_key, image_sha256, import_batch_id, CURRENT_TIMESTAMP
         FROM jsonb_to_recordset($1::jsonb) AS incoming(
           product_id TEXT, category_slug TEXT, category_name TEXT, subcategory_name TEXT,
           currency VARCHAR(3), price NUMERIC(12,2), source_batch TEXT, product_data JSONB,
           sku_key TEXT, product_name_key TEXT, image_sha256 CHAR(64), import_batch_id TEXT
         )
         ON CONFLICT (product_id) DO UPDATE SET
           category_slug = EXCLUDED.category_slug,
           category_name = EXCLUDED.category_name,
           subcategory_name = EXCLUDED.subcategory_name,
           currency = EXCLUDED.currency,
           price = EXCLUDED.price,
           source_batch = EXCLUDED.source_batch,
           product_data = EXCLUDED.product_data,
           sku_key = EXCLUDED.sku_key,
           product_name_key = EXCLUDED.product_name_key,
           image_sha256 = EXCLUDED.image_sha256,
           import_batch_id = EXCLUDED.import_batch_id,
           updated_at = CURRENT_TIMESTAMP
         WHERE storehouse_catalog_products.import_batch_id = EXCLUDED.import_batch_id`,
        [JSON.stringify(insertRows)]
      );
      if (inserted.rowCount !== chunk.length) fail('A product ID already belongs to a different import batch.');
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      await pool.query(
        `UPDATE storehouse_catalog_import_batches SET status = 'failed', errors = errors || $2::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [batchId, JSON.stringify([{ stage: 'uploading', message: error.message }])]
      );
      throw error;
    } finally {
      client.release();
    }
    const progress = await refreshBatchCounts(pool, batchId);
    console.log(`Staged ${progress.uploaded.toLocaleString()} / ${EXPECTED_TOTAL.toLocaleString()} products.`);
  }

  const stagedCounts = await refreshBatchCounts(pool, batchId);
  if (stagedCounts.uploaded !== EXPECTED_TOTAL || Object.values(stagedCounts.counts).some((count) => count !== TARGET_PER_CATEGORY)) {
    fail('Staged database counts do not match the required 300 products in every category.');
  }
  await pool.query(`UPDATE storehouse_catalog_import_batches SET status = 'publishing', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [batchId]);
  const preparedByProductId = new Map(prepared.map((row) => [row.productId, row]));

  while (true) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const next = await client.query(
        `SELECT product_id, product_data->>'mainImage' AS image_path, image_sha256
         FROM storehouse_catalog_products
         WHERE import_batch_id = $1 AND source_batch = $2
         ORDER BY product_id
         LIMIT $3`,
        [batchId, stagedBatch, CHUNK_SIZE]
      );
      if (!next.rowCount) {
        await client.query('COMMIT');
        break;
      }
      for (const record of next.rows) {
        const sourceRow = preparedByProductId.get(record.product_id);
        if (!sourceRow || sourceRow.imageSha256 !== record.image_sha256.trim()) {
          fail(`Staged image manifest mismatch for ${record.product_id}.`);
        }
        const sourceImagePath = path.resolve(imageRoot, sourceRow.imageRelative);
        const imageBytes = await fs.readFile(sourceImagePath);
        if (sha256(imageBytes) !== sourceRow.imageSha256) fail(`Source image changed after validation: ${sourceRow.imageRelative}.`);
        const target = path.resolve('public', record.image_path.replace(/^\//, ''));
        const imageRootPath = path.resolve('public', 'images', 'storehouse-catalog') + path.sep;
        if (!target.startsWith(imageRootPath)) fail(`Unsafe image destination for ${record.product_id}.`);
        await fs.mkdir(path.dirname(target), { recursive: true });
        try {
          const existingBytes = await fs.readFile(target);
          if (sha256(existingBytes) !== sourceRow.imageSha256) fail(`Existing image asset does not match its hash: ${record.image_path}.`);
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
          await fs.writeFile(target, imageBytes, { flag: 'wx' });
        }
      }
      const ids = next.rows.map((row) => row.product_id);
      await client.query(
        `UPDATE storehouse_catalog_products SET source_batch = $2, updated_at = CURRENT_TIMESTAMP
         WHERE import_batch_id = $1 AND product_id = ANY($3::text[])`,
        [batchId, VERIFIED_BATCH, ids]
      );
      const published = await client.query(
        `SELECT COUNT(*)::int AS count FROM storehouse_catalog_products
         WHERE import_batch_id = $1 AND source_batch = $2`,
        [batchId, VERIFIED_BATCH]
      );
      await client.query(
        `UPDATE storehouse_catalog_import_batches SET published_products = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [batchId, published.rows[0].count]
      );
      await client.query('COMMIT');
      console.log(`Published ${published.rows[0].count.toLocaleString()} / ${EXPECTED_TOTAL.toLocaleString()} products.`);
    } catch (error) {
      await client.query('ROLLBACK');
      await pool.query(
        `UPDATE storehouse_catalog_import_batches SET status = 'failed', errors = errors || $2::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [batchId, JSON.stringify([{ stage: 'publishing', message: error.message }])]
      );
      throw error;
    } finally {
      client.release();
    }
  }

  const publishedResult = await pool.query(
    `SELECT COUNT(*)::int AS count FROM storehouse_catalog_products WHERE import_batch_id = $1 AND source_batch = $2`,
    [batchId, VERIFIED_BATCH]
  );
  if (publishedResult.rows[0].count !== EXPECTED_TOTAL) fail('The final published count is incomplete.');
  await pool.query(
    `UPDATE storehouse_catalog_import_batches
     SET status = 'completed', published_products = $2, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [batchId, EXPECTED_TOTAL]
  );

  const report = {
    batchId,
    totalProducts: EXPECTED_TOTAL,
    categories: categoryCounts,
    uniqueSkus: new Set(prepared.map((row) => row.skuKey)).size,
    uniqueNames: new Set(prepared.map((row) => row.nameKey)).size,
    uniqueImageSha256: new Set(prepared.map((row) => row.imageSha256)).size,
    failedImages: 0,
    duplicateRows: 0,
    status: 'completed',
  };
  const reportsDirectory = path.resolve('product-imports', 'reports');
  await fs.mkdir(reportsDirectory, { recursive: true });
  await fs.writeFile(path.join(reportsDirectory, `${batchId}.json`), JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify(report, null, 2));
}

async function main() {
  const csvPath = path.resolve(readArgument('--csv'));
  const imageRoot = path.resolve(readArgument('--images'));
  if (!readArgument('--csv') || !readArgument('--images')) {
    fail('Usage: npm run catalog:import -- --csv product-imports/catalog.csv --images product-imports/images');
  }
  const pool = new Pool({ connectionString: loadDatabaseUrl(), connectionTimeoutMillis: 5000, max: 5 });
  try {
    const client = await pool.connect();
    try { await ensureDatabase(client); } finally { client.release(); }
    await importDataset({ csvPath, imageRoot, pool });
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`Catalog import stopped: ${error.message}`);
  process.exitCode = 1;
});
