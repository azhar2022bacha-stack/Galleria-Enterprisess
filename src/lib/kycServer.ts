import fs from 'fs';
import path from 'path';
import { dbQuery, isDbConnected } from './db';

export interface KycSubmission {
  id: string;
  sellerEmail: string;
  sellerName: string;
  shopName: string;
  docType: 'National ID Card (NIC)' | 'Passport' | 'Driving Licence' | 'Residence Permit';
  frontImage: string;
  backImage?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const KYC_FILE = path.join(DATA_DIR, 'kyc_submissions.json');
const SELLERS_FILE = path.join(DATA_DIR, 'sellers.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readDiskKyc(): KycSubmission[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(KYC_FILE)) {
      fs.writeFileSync(KYC_FILE, '[]', 'utf8');
      return [];
    }
    const raw = fs.readFileSync(KYC_FILE, 'utf8');
    const clean = raw.replace(/^\uFEFF/, '').trim();
    if (!clean) return [];
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') return [parsed];
    return [];
  } catch (err) {
    console.warn('Failed reading disk KYC submissions:', err);
    return [];
  }
}

export function writeDiskKyc(submissions: KycSubmission[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(KYC_FILE, JSON.stringify(submissions, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed writing disk KYC submissions:', err);
  }
}

/**
 * Updates seller idStatus in disk sellers mirror
 */
function updateSellerDiskIdStatus(email: string, idStatus: string): void {
  try {
    ensureDataDir();
    if (!fs.existsSync(SELLERS_FILE)) return;
    const raw = fs.readFileSync(SELLERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const sellers = Array.isArray(parsed) ? parsed : [parsed];
    const normalized = (email || '').trim().toLowerCase();
    const updated = sellers.map((s: any) => {
      if ((s.email || '').toLowerCase() === normalized) {
        return {
          ...s,
          idStatus,
          status: idStatus === 'Verified' ? 'approved' : s.status,
        };
      }
      return s;
    });
    fs.writeFileSync(SELLERS_FILE, JSON.stringify(updated, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed updating disk seller idStatus:', err);
  }
}

/**
 * Fetch all KYC submissions from PostgreSQL or disk fallback
 */
export async function getAllKycSubmissionsServer(): Promise<KycSubmission[]> {
  const dbOnline = await isDbConnected();
  if (dbOnline) {
    try {
      const res = await dbQuery<{
        id: number;
        seller_email: string;
        seller_name: string;
        shop_name: string;
        doc_type: string;
        front_image: string;
        back_image: string | null;
        status: string;
        rejection_reason: string | null;
        submitted_at: Date | string;
        reviewed_at: Date | string | null;
        reviewed_by: string | null;
      }>('SELECT * FROM kyc_submissions ORDER BY id DESC');

      if (res && res.rows) {
        if (res.rows.length === 0) {
          // A newly connected/empty database must not erase older verified submissions
          // that were written to the local mirror while PostgreSQL was unavailable.
          const diskSubmissions = readDiskKyc();
          if (diskSubmissions.length > 0) return diskSubmissions;
        }
        const mapped: KycSubmission[] = res.rows.map((r) => ({
          id: `kyc-db-${r.id}`,
          sellerEmail: r.seller_email,
          sellerName: r.seller_name,
          shopName: r.shop_name,
          docType: r.doc_type as any,
          frontImage: r.front_image,
          backImage: r.back_image || undefined,
          status: (r.status.toLowerCase() as any) || 'pending',
          rejectionReason: r.rejection_reason || undefined,
          submittedAt: r.submitted_at instanceof Date ? r.submitted_at.toISOString() : String(r.submitted_at),
          reviewedAt: r.reviewed_at ? (r.reviewed_at instanceof Date ? r.reviewed_at.toISOString() : String(r.reviewed_at)) : undefined,
          reviewedBy: r.reviewed_by || undefined,
        }));
        // Update disk mirror
        writeDiskKyc(mapped);
        return mapped;
      }
    } catch (err: any) {
      console.warn('Failed to query kyc_submissions from PostgreSQL, using disk fallback:', err.message);
    }
  }

  return readDiskKyc();
}

/**
 * Get KYC submission for a specific seller email
 */
export async function getKycSubmissionByEmailServer(email: string): Promise<KycSubmission | null> {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return null;

  const all = await getAllKycSubmissionsServer();
  return all.find((item) => (item.sellerEmail || '').toLowerCase() === normalized) || null;
}

/**
 * Submit or update a KYC application from the User Panel
 */
export async function submitKycServer(data: {
  sellerEmail: string;
  sellerName: string;
  shopName: string;
  docType: 'National ID Card (NIC)' | 'Passport' | 'Driving Licence' | 'Residence Permit';
  frontImage: string;
  backImage?: string;
}): Promise<KycSubmission> {
  const normalizedEmail = (data.sellerEmail || '').trim().toLowerCase();
  const submittedAt = new Date().toISOString();
  const dbOnline = await isDbConnected();

  let submissionRecord: KycSubmission;

  if (dbOnline) {
    try {
      // Check if submission already exists for this email
      const existing = await dbQuery<{ id: number }>(
        'SELECT id FROM kyc_submissions WHERE LOWER(seller_email) = $1 LIMIT 1',
        [normalizedEmail]
      );

      if (existing && existing.rows && existing.rows.length > 0) {
        const id = existing.rows[0].id;
        await dbQuery(
          `UPDATE kyc_submissions
           SET seller_name = $1, shop_name = $2, doc_type = $3, front_image = $4,
               back_image = $5, status = 'pending', rejection_reason = '',
               submitted_at = CURRENT_TIMESTAMP, reviewed_at = NULL, reviewed_by = NULL
           WHERE id = $6`,
          [
            data.sellerName,
            data.shopName,
            data.docType,
            data.frontImage,
            data.backImage || null,
            id,
          ]
        );
        submissionRecord = {
          id: `kyc-db-${id}`,
          sellerEmail: normalizedEmail,
          sellerName: data.sellerName,
          shopName: data.shopName,
          docType: data.docType,
          frontImage: data.frontImage,
          backImage: data.backImage,
          status: 'pending',
          submittedAt,
        };
      } else {
        const insertRes = await dbQuery<{ id: number }>(
          `INSERT INTO kyc_submissions (
             seller_email, seller_name, shop_name, doc_type, front_image, back_image, status, submitted_at
           ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', CURRENT_TIMESTAMP)
           RETURNING id`,
          [
            normalizedEmail,
            data.sellerName,
            data.shopName,
            data.docType,
            data.frontImage,
            data.backImage || null,
          ]
        );
        const newId = insertRes && insertRes.rows && insertRes.rows[0] ? insertRes.rows[0].id : Date.now();
        submissionRecord = {
          id: `kyc-db-${newId}`,
          sellerEmail: normalizedEmail,
          sellerName: data.sellerName,
          shopName: data.shopName,
          docType: data.docType,
          frontImage: data.frontImage,
          backImage: data.backImage,
          status: 'pending',
          submittedAt,
        };
      }

      // Update sellers table: id_status = 'Pending verification'
      await dbQuery(
        `UPDATE sellers
         SET id_status = 'Pending verification'
         WHERE LOWER(email) = $1`,
        [normalizedEmail]
      );
    } catch (err: any) {
      console.warn('PostgreSQL error during submitKyc, proceeding with disk mirror:', err.message);
      submissionRecord = {
        id: `kyc-disk-${Date.now()}`,
        sellerEmail: normalizedEmail,
        sellerName: data.sellerName,
        shopName: data.shopName,
        docType: data.docType,
        frontImage: data.frontImage,
        backImage: data.backImage,
        status: 'pending',
        submittedAt,
      };
    }
  } else {
    submissionRecord = {
      id: `kyc-disk-${Date.now()}`,
      sellerEmail: normalizedEmail,
      sellerName: data.sellerName,
      shopName: data.shopName,
      docType: data.docType,
      frontImage: data.frontImage,
      backImage: data.backImage,
      status: 'pending',
      submittedAt,
    };
  }

  // Update disk mirror
  const currentDisk = readDiskKyc();
  const existingIndex = currentDisk.findIndex(
    (k) => (k.sellerEmail || '').toLowerCase() === normalizedEmail
  );

  if (existingIndex >= 0) {
    currentDisk[existingIndex] = {
      ...currentDisk[existingIndex],
      ...submissionRecord,
    };
    writeDiskKyc(currentDisk);
  } else {
    writeDiskKyc([submissionRecord, ...currentDisk]);
  }

  // Update sellers disk mirror
  updateSellerDiskIdStatus(normalizedEmail, 'Pending verification');

  return submissionRecord;
}

/**
 * Admin action: Approve or Reject KYC submission
 */
export async function updateKycStatusServer(
  idOrEmail: string,
  status: 'approved' | 'rejected',
  rejectionReason = '',
  reviewedBy = 'Administrator'
): Promise<KycSubmission | null> {
  const now = new Date().toISOString();
  const dbOnline = await isDbConnected();

  let targetEmail = '';
  let updatedRecord: KycSubmission | null = null;

  // Extract raw db ID if prefixed
  const numericId = idOrEmail.startsWith('kyc-db-')
    ? parseInt(idOrEmail.replace('kyc-db-', ''), 10)
    : parseInt(idOrEmail, 10);

  if (dbOnline) {
    try {
      let targetRow: any = null;
      if (!isNaN(numericId)) {
        const findRes = await dbQuery('SELECT * FROM kyc_submissions WHERE id = $1', [numericId]);
        if (findRes && findRes.rows && findRes.rows.length > 0) targetRow = findRes.rows[0];
      } else {
        const findRes = await dbQuery('SELECT * FROM kyc_submissions WHERE LOWER(seller_email) = $1', [
          idOrEmail.toLowerCase(),
        ]);
        if (findRes && findRes.rows && findRes.rows.length > 0) targetRow = findRes.rows[0];
      }

      if (targetRow) {
        targetEmail = targetRow.seller_email;
        await dbQuery(
          `UPDATE kyc_submissions
           SET status = $1, rejection_reason = $2, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $3
           WHERE id = $4`,
          [status, rejectionReason, reviewedBy, targetRow.id]
        );

        const newIdStatus = status === 'approved' ? 'Verified' : 'Rejected';
        await dbQuery(
          `UPDATE sellers
           SET id_status = $1,
               status = CASE WHEN $2 = 'approved' THEN 'approved' ELSE status END
           WHERE LOWER(email) = LOWER($3)`,
          [newIdStatus, status, targetEmail]
        );
      }
    } catch (err: any) {
      console.warn('PostgreSQL error during updateKycStatusServer:', err.message);
    }
  }

  // Always sync disk mirror
  const diskItems = readDiskKyc();
  const idx = diskItems.findIndex(
    (k) =>
      k.id === idOrEmail ||
      (!isNaN(numericId) && k.id === `kyc-db-${numericId}`) ||
      (k.sellerEmail && k.sellerEmail.toLowerCase() === idOrEmail.toLowerCase())
  );

  if (idx >= 0) {
    const item = diskItems[idx];
    targetEmail = targetEmail || item.sellerEmail;
    diskItems[idx] = {
      ...item,
      status,
      rejectionReason: status === 'rejected' ? rejectionReason : undefined,
      reviewedAt: now,
      reviewedBy,
    };
    writeDiskKyc(diskItems);
    updatedRecord = diskItems[idx];
  }

  if (targetEmail) {
    const newIdStatus = status === 'approved' ? 'Verified' : 'Rejected';
    updateSellerDiskIdStatus(targetEmail, newIdStatus);
  }

  return updatedRecord;
}

/**
 * Clear all KYC records (for clean database wipes)
 */
export async function clearKycSubmissionsServer(): Promise<void> {
  const dbOnline = await isDbConnected();
  if (dbOnline) {
    try {
      await dbQuery('DELETE FROM kyc_submissions');
    } catch (err: any) {
      console.warn('Failed clearing PostgreSQL kyc_submissions table:', err.message);
    }
  }
  writeDiskKyc([]);
}
