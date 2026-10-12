import fs from 'fs';
import path from 'path';

const FILE = path.resolve(process.cwd(), 'data', 'weekly-mailtm-accounts.json');

export interface WeeklyAccountRecord {
  date: string;
  mailTmEmail: string;
  mailTmPassword: string;
  ordersPlaced: number;
  note?: string;
}

function readAll(): WeeklyAccountRecord[] {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
}

function writeAll(list: WeeklyAccountRecord[]): void {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

/** Call right after the mail.tm account is created, BEFORE any order is placed. */
export function saveWeeklyAccount(email: string, password: string): void {
  const list = readAll();
  list.push({
    date: new Date().toISOString(),
    mailTmEmail: email,
    mailTmPassword: password,
    ordersPlaced: 0,
  });
  writeAll(list);

  console.log('========== WEEKLY MAIL.TM ACCOUNT ==========');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log('Login at: https://mail.tm');
  console.log('============================================');
}

/** Call after each successful order so the file always shows the real count. */
export function updateOrdersPlaced(email: string, ordersPlaced: number): void {
  const list = readAll();
  const record = list.find((r) => r.mailTmEmail === email);
  if (record) {
    record.ordersPlaced = ordersPlaced;
    writeAll(list);
  }
}