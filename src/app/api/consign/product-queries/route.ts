import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { createSellerNotificationServer } from '@/lib/sellerNotificationsServer';
import { getRequestAdmin } from '@/lib/adminSession';
import { getRequestSellerEmail } from '@/lib/sellerSession';

export const dynamic = 'force-dynamic';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'consign_product_queries.json');

export interface ConsignProductQueryRecord {
  id: string;
  source: 'admin-consign';
  sellerEmail: string;
  sellerName: string;
  userName: string;
  productId: string;
  productName: string;
  productImage?: string;
  orderId?: string;
  orderCode?: string;
  topic: string;
  subject: string;
  question: string;
  reply?: string;
  status: 'Open' | 'Replied';
  createdAt: string;
  repliedAt?: string;
}

function readQueries(): ConsignProductQueryRecord[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueries(queries: ConsignProductQueryRecord[]): void {
  const directory = path.dirname(DATA_FILE);
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
  const temporaryFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(queries, null, 2), 'utf8');
  fs.renameSync(temporaryFile, DATA_FILE);
}

function getSellerSessionEmail(request: Request): string {
  return getRequestSellerEmail(request);
}

export async function GET(request: Request) {
  const queries = readQueries().sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  if (new URL(request.url).searchParams.get('all') === 'true') {
    if (!(await getRequestAdmin(request))) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
    return NextResponse.json({ success: true, queries });
  }

  const sellerEmail = getSellerSessionEmail(request);
  if (!sellerEmail) {
    return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    queries: queries.filter((query) => query.sellerEmail === sellerEmail),
  });
}

export async function POST(request: Request) {
  try {
    if (!(await getRequestAdmin(request))) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
    const body = await request.json();
    const sellerEmail = String(body?.sellerEmail || '').trim().toLowerCase();
    const productName = String(body?.productName || '').trim();
    const subject = String(body?.subject || '').trim();
    const question = String(body?.question || '').trim();
    if (!sellerEmail || !productName || !subject || !question) {
      return NextResponse.json(
        { success: false, error: 'Seller, product, subject, and question are required.' },
        { status: 400 }
      );
    }
    if (subject.length > 140 || question.length > 3000) {
      return NextResponse.json(
        { success: false, error: 'Subject must be under 140 characters and question under 3,000 characters.' },
        { status: 400 }
      );
    }

    const query: ConsignProductQueryRecord = {
      id: randomUUID(),
      source: 'admin-consign',
      sellerEmail,
      sellerName: String(body?.sellerName || '').trim().slice(0, 120),
      userName: 'Admin',
      productId: String(body?.productId || '').trim().slice(0, 160),
      productName: productName.slice(0, 180),
      ...(typeof body?.productImage === 'string' && body.productImage.trim()
        ? { productImage: body.productImage.trim().slice(0, 1200) }
        : {}),
      ...(typeof body?.orderId === 'string' && body.orderId.trim()
        ? { orderId: body.orderId.trim().slice(0, 160) }
        : {}),
      ...(typeof body?.orderCode === 'string' && body.orderCode.trim()
        ? { orderCode: body.orderCode.trim().slice(0, 100) }
        : {}),
      topic: String(body?.topic || 'General product question').trim().slice(0, 80),
      subject: subject.slice(0, 140),
      question: question.slice(0, 3000),
      status: 'Open',
      createdAt: new Date().toISOString(),
    };

    const queries = readQueries();
    queries.unshift(query);
    writeQueries(queries);

    try {
      createSellerNotificationServer({
        sellerEmail,
        category: 'Products & Stock',
        title: `Admin product question: ${query.productName}`,
        message: [
          { text: `Admin has a question about ${query.productName}. ` },
          { text: `${query.subject}: `, emphasis: 'blue' },
          { text: query.question },
          ...(query.orderCode ? [{ text: ` Related Consign order: #${query.orderCode}.` }] : []),
          { text: 'Open Product Queries in your seller account to reply.' },
        ],
        tone: 'info',
        href: '/seller/dashboard?tab=queries',
        dedupeKey: `admin-product-query:${query.id}`,
      });
    } catch (error) {
      console.error('Unable to create product query notification:', error);
    }

    return NextResponse.json({ success: true, query });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to send product query.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const sellerEmail = getSellerSessionEmail(request);
    if (!sellerEmail) {
      return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });
    }

    const body = await request.json();
    const id = String(body?.id || '').trim();
    const reply = String(body?.reply || '').trim();
    if (!id || !reply) {
      return NextResponse.json({ success: false, error: 'Query ID and reply are required.' }, { status: 400 });
    }
    if (reply.length > 3000) {
      return NextResponse.json({ success: false, error: 'Reply must be under 3,000 characters.' }, { status: 400 });
    }

    const queries = readQueries();
    const index = queries.findIndex((query) => query.id === id && query.sellerEmail === sellerEmail);
    if (index < 0) {
      return NextResponse.json({ success: false, error: 'Product query was not found for this seller.' }, { status: 404 });
    }

    const updatedQuery: ConsignProductQueryRecord = {
      ...queries[index],
      reply,
      status: 'Replied',
      repliedAt: new Date().toISOString(),
    };
    queries[index] = updatedQuery;
    writeQueries(queries);
    return NextResponse.json({ success: true, query: updatedQuery });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to save query reply.' },
      { status: 500 }
    );
  }
}
