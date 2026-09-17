import { APIRequestContext, request } from '@playwright/test';

const MAILTM_BASE_URL = 'https://api.mail.tm';

export interface MailTmAccount {
  address: string;
  password: string;
  token: string;
}

export interface MailTmMessage {
  id: string;
  subject: string;
  from: { address: string; name: string };
  intro: string;
}

let sharedContext: APIRequestContext | null = null;

async function getContext(): Promise<APIRequestContext> {
  if (!sharedContext) {
    sharedContext = await request.newContext({ baseURL: MAILTM_BASE_URL });
  }
  return sharedContext;
}

export async function getRandomDomain(): Promise<string> {
  const api = await getContext();
  const res = await api.get('/domains');
  const body = await res.json();

  const domains = body['hydra:member'] ?? [];
  const activeDomains = domains.filter((d: any) => d.isActive === true);

  if (activeDomains.length === 0) {
    throw new Error(`No active mail.tm domains available. Raw response: ${JSON.stringify(domains)}`);
  }

  const chosen = activeDomains[Math.floor(Math.random() * activeDomains.length)];
  return chosen.domain;
}

export async function createAccount(address: string, password: string): Promise<void> {
  await requestWithRetry(async () => {
    const api = await getContext();
    const res = await api.post('/accounts', {
      data: { address, password },
    });
    if (!res.ok()) {
      throw new Error(`mail.tm account creation failed: ${res.status()} ${await res.text()}`);
    }
  });
}


async function requestWithRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1500): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const msg = err.message ?? '';
      const isTransient =
        msg.includes('429') ||
        msg.includes('ECONNRESET') ||
        msg.includes('ETIMEDOUT') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('socket hang up');

      if (isTransient && attempt < retries) {
        console.log(`mail.tm transient error (attempt ${attempt}/${retries}): ${msg} — retrying in ${delayMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Unreachable');
}

export async function getToken(address: string, password: string): Promise<string> {
  const api = await getContext();
  const res = await api.post('/token', {
    data: { address, password },
  });
  const body = await res.json();
  return body.token;
}

export async function listMessages(token: string): Promise<MailTmMessage[]> {
  return requestWithRetry(async () => {
    const api = await getContext();
    const res = await api.get('/messages', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    return body['hydra:member'] ?? [];
  });
}

export async function getMessageBody(token: string, messageId: string): Promise<string> {
  const api = await getContext();
  const res = await api.get(`/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  // html is an array of HTML strings; text is the plain-text fallback
  return Array.isArray(body.html) ? body.html.join('\n') : body.text ?? '';
}

/**
 * Polls the inbox until a message arrives, then returns it.
 * mail.tm doesn't push in real time via plain REST, so polling is the standard approach.
 */
export async function waitForMessage(
  token: string,
  options: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<MailTmMessage> {
  const timeoutMs = options.timeoutMs ?? 30000;
  const intervalMs = options.intervalMs ?? 2000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const messages = await listMessages(token);
    if (messages.length > 0) {
      return messages[0]; // most recent first, per mail.tm's default ordering
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`No email arrived within ${timeoutMs}ms`);
}

/**
 * Extracts the first confirmation/verification link from an HTML email body.
 * Looks for an <a href="..."> tag; adjust the keyword filter once you see the real email content.
 */
export function extractConfirmationLink(htmlBody: string): string {
  const hrefMatches = [...htmlBody.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

  const confirmLink = hrefMatches.find((href) => href.includes('globbing.com'));

  if (!confirmLink) {
    throw new Error(`No confirmation link found. Raw href list: ${hrefMatches.join(', ')}`);
  }

  return confirmLink.replace(/&amp;/g, '&');
}

export async function closeMailTmContext(): Promise<void> {
  if (sharedContext) {
    await sharedContext.dispose();
    sharedContext = null;
  }
}