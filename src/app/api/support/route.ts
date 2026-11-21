import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { createSellerNotificationServer } from '@/lib/sellerNotificationsServer';
import { getRequestAdmin } from '@/lib/adminSession';
import { getRequestSellerEmail } from '@/lib/sellerSession';
export const dynamic = 'force-dynamic';
const profileFile = path.join(process.cwd(), 'src/data/support_profiles.json');
function profiles(): Record<string,string> { return fs.existsSync(profileFile) ? JSON.parse(fs.readFileSync(profileFile,'utf8')) : {}; }
const file = path.join(process.cwd(), 'src/data/support_chats.json');
function read(): any[] { return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []; }
function save(data: any[]) { fs.writeFileSync(file + '.tmp', JSON.stringify(data)); fs.renameSync(file + '.tmp', file); }
export async function GET(req: Request) {
 const q = new URL(req.url).searchParams; const email = q.get('email');
 const admin = await getRequestAdmin(req);
 if (!email && !admin) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 });
 if (email && !admin) {
  const normalizedSessionEmail = getRequestSellerEmail(req);
  if (!normalizedSessionEmail) return NextResponse.json({ error: 'Seller sign-in is required.' }, { status: 401 });
  if (normalizedSessionEmail !== email.trim().toLowerCase()) return NextResponse.json({ error: 'You can only access your own support conversation.' }, { status: 403 });
 }
 const chats = read();
 const scopedChats = email ? chats.filter(c => c.email === email.trim().toLowerCase()) : chats;
 if (q.get('summary') === '1') {
  const viewerRole = admin ? 'admin' : 'seller';
  const incoming = scopedChats.flatMap((chat) => (Array.isArray(chat.messages) ? chat.messages : [])
   .filter((message: any) => message.role !== viewerRole && !message.deleted && !message.hiddenFor?.includes(viewerRole)));
  return NextResponse.json({ unreadCount: incoming.filter((message: any) => !message.read).length, incomingIds: incoming.map((message: any) => message.id).filter(Boolean) });
 }
 return NextResponse.json({ chats: scopedChats, profiles: profiles() });
}
export async function POST(req: Request) {
 try {
 const b = await req.json(); const email = String(b.email || '').trim().toLowerCase();
 if (!email || !['seller', 'admin'].includes(b.role)) return NextResponse.json({ error: 'A seller account is required.' }, { status: 400 });
 if (b.role === 'admin') {
  if (!(await getRequestAdmin(req))) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 });
 } else {
  const normalizedSessionEmail = getRequestSellerEmail(req);
  if (!normalizedSessionEmail || normalizedSessionEmail !== email) return NextResponse.json({ error: 'Sign in to the matching seller account.' }, { status: 401 });
 }
 if (b.action === 'profile') {
 const key=b.role==='admin'?'admin':email; const photo=b.photo;
 if(photo && (typeof photo!=='string'||!/^data:image\/(png|jpeg|webp);base64,/.test(photo)||photo.length>2800000))throw new Error('Choose a valid image smaller than 2 MB.');
 const all=profiles(); if(photo)all[key]=photo;else delete all[key];fs.writeFileSync(profileFile,JSON.stringify(all));return NextResponse.json({success:true});
 }
 const chats = read(); let chat = chats.find(c => c.email === email);
 if (!chat) { chat = { id: randomUUID(), email, name: String(b.name || email).slice(0,120), messages: [], status: 'open' }; chats.push(chat); }
 if (b.action === 'heartbeat') {
 chat.presence = chat.presence || {};
 chat.presence[b.role] = Date.now();
 chat.messages.forEach((m: any) => { if (m.role !== b.role) { m.delivered = true; m.read = true; } });
 } else if (b.action === 'presence') {
 chat.presence = chat.presence || {};
 chat.presence[b.role] = Date.now();
 chat.messages.forEach((m: any) => { if (m.role !== b.role) m.delivered = true; });
 } else if (b.action === 'send') {
 const text = String(b.text || '').trim().slice(0,4000);
 const attachment = b.attachment;
 if (attachment && (!/^data:(image\/(png|jpeg|webp)|audio\/(webm|ogg|mp4))([;,])/.test(attachment.url) || attachment.url.length > 7000000)) throw new Error('Unsupported attachment or file too large.');
 if (!text && !attachment) throw new Error('Enter a message or attach a file.');
 chat.messages.push({ id: randomUUID(), role: b.role, text, attachment, delivered: Date.now() - (chat.presence?.[b.role === 'admin' ? 'seller' : 'admin'] || 0) < 12000, at: new Date().toISOString(), reply: b.reply || undefined }); chat.status = 'open';
 if (b.role === 'admin') {
  try {
   createSellerNotificationServer({
    sellerEmail: email,
    category: 'Support',
    title: 'A new message from Galleria Enterprises, Inc. Support',
    message: [
     { text: 'Galleria Enterprises, Inc. Support sent you a message: ' },
     { text: text || 'An attachment was added to your support conversation.', emphasis: 'blue' },
     { text: ' Open your Support conversation to reply.' },
    ],
    tone: 'info',
    href: '/seller/dashboard?tab=support',
    dedupeKey: `support-message:${chat.messages.at(-1)?.id}`,
   });
  } catch (notificationError) {
   console.error('Unable to create support notification:', notificationError);
  }
 }
  } else if (b.action === 'pin') {
 const m = chat.messages.find((m: any) => m.id === b.messageId);
 if (!m || m.deleted) throw new Error('Message not found.');
 m.pinned = !m.pinned;
 } else if (b.action === 'deleteForMe') {
 const m = chat.messages.find((m: any) => m.id === b.messageId);
 if (!m) throw new Error('Message not found.');
 m.hiddenFor = Array.from(new Set([...(m.hiddenFor || []), b.role]));
 } else if (b.action === 'edit' || b.action === 'delete') {
 const m = chat.messages.find((m: any) => m.id === b.messageId);
 if (!m || m.role !== b.role || m.deleted) throw new Error('You can only change your own messages.');
 if (b.action === 'delete') { m.deleted = true; m.text = ''; delete m.attachment; } else { const text = String(b.text || '').trim().slice(0,4000); if (!text) throw new Error('Message cannot be empty.'); m.text = text; m.edited = true; }
 } else if (b.action === 'status' && b.role === 'admin') {
  chat.status = chat.status === 'closed' ? 'open' : 'closed';
  if (chat.status === 'closed') {
   try {
    createSellerNotificationServer({
     sellerEmail: email,
     category: 'Support',
     title: 'Your support case has been resolved',
     message: [
      { text: 'Your support conversation has been marked as ' },
      { text: 'resolved', emphasis: 'blue' },
      { text: '. You can contact us again if you still need help.' },
     ],
     tone: 'success',
     href: '/seller/dashboard?tab=support',
     dedupeKey: `support-closed:${chat.id}:${Date.now()}`,
    });
   } catch (notificationError) {
    console.error('Unable to create support resolution notification:', notificationError);
   }
  }
 }
 else if (b.action === 'read') { chat.messages.forEach((m: any) => { if (m.role !== b.role) { m.read = true; m.delivered = true; } }); }
 else throw new Error('Unsupported action.');
 chat.updatedAt = new Date().toISOString(); save(chats); return NextResponse.json({ chat });
 } catch(e: any) { return NextResponse.json({ error: e.message || 'Unable to save message.' }, { status: 400 }); }
}
