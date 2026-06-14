/** 簡易 JSONL 儲存（體驗版；正式版可換 DB）。 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(__dirname, '../../data');

function file(name) { return path.join(DIR, name); }
async function readAll(name) {
  try { return (await fs.promises.readFile(file(name), 'utf8')).trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); }
  catch { return []; }
}
async function append(name, rec) { await fs.promises.mkdir(DIR, { recursive: true }); await fs.promises.appendFile(file(name), JSON.stringify(rec) + '\n', 'utf8'); }
async function writeAll(name, rows) { await fs.promises.mkdir(DIR, { recursive: true }); await fs.promises.writeFile(file(name), rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''), 'utf8'); }
const now = () => new Date().toISOString();
const id = (p) => p + crypto.randomBytes(6).toString('hex');

// ── 互動紀錄 ──
export async function saveInteraction(rec) { await append('interactions.jsonl', rec); return rec; }
export async function listInteractions(limit = 50) { return (await readAll('interactions.jsonl')).slice(-limit).reverse(); }
export async function interactionsByPhone(phone, limit = 50) {
  if (!phone) return [];
  return (await readAll('interactions.jsonl')).filter((r) => r.customer?.phone === phone).slice(-limit).reverse();
}

// ── 客戶 ──
export async function listCustomers(q = '', limit = 200) {
  let rows = await readAll('customers.jsonl');
  if (q) rows = rows.filter((r) => (r.name || '').includes(q) || (r.phone || '').includes(q));
  return rows.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).slice(0, limit);
}
export async function getCustomer(cid) { return (await readAll('customers.jsonl')).find((r) => r.id === cid) || null; }
export async function createCustomer(data) {
  const rec = { id: id('c_'), name: data.name || '', gender: data.gender || '', phone: data.phone || '', address: data.address || '', birth: data.birth || null, note: data.note || '', createdAt: now(), updatedAt: now() };
  const rows = await readAll('customers.jsonl'); rows.push(rec); await writeAll('customers.jsonl', rows); return rec;
}
export async function updateCustomer(cid, patch) {
  const rows = await readAll('customers.jsonl'); const i = rows.findIndex((r) => r.id === cid); if (i < 0) return null;
  for (const f of ['name', 'gender', 'phone', 'address', 'birth', 'note']) if (f in patch) rows[i][f] = patch[f];
  rows[i].updatedAt = now(); await writeAll('customers.jsonl', rows); return rows[i];
}
export async function removeCustomer(cid) {
  const rows = await readAll('customers.jsonl'); const next = rows.filter((r) => r.id !== cid);
  if (next.length === rows.length) return false; await writeAll('customers.jsonl', next); return true;
}
