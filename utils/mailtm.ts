import {
  APIRequestContext,
  APIResponse,
  request,
} from '@playwright/test';

const MAILTM_BASE_URL = 'https://api.mail.tm';

export interface MailTmAccount {
  address: string;
  password: string;
  token: string;
}

export interface MailTmMessage {
  id: string;
  subject: string;
  from: {
    address: string;
    name: string;
  };
  intro: string;
}

let sharedContext: APIRequestContext | null = null;

async function getContext(): Promise<APIRequestContext> {
  if (!sharedContext) {
    sharedContext = await request.newContext({
      baseURL: MAILTM_BASE_URL,
    });
  }

  return sharedContext;
}

/**
 * Throws an error when mail.tm returns a non-2xx response.
 * This allows requestWithRetry() to retry transient HTTP errors.
 */
async function ensureOk(
  res: APIResponse,
  operation: string
): Promise<void> {
  if (!res.ok()) {
    const body = await res.text();

    throw new Error(
      `mail.tm ${operation} failed: ${res.status()} ${body}`
    );
  }
}

/**
 * Retries transient mail.tm/network errors.
 *
 * Retryable:
 * - 408
 * - 429
 * - 500
 * - 502
 * - 503
 * - 504
 * - ECONNRESET
 * - ETIMEDOUT
 * - ECONNREFUSED
 * - socket hang up
 */
async function requestWithRetry<T>(
  fn: () => Promise<T>,
  retries = 5,
  delayMs = 2000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;

      const message = err?.message ?? String(err);

      const isTransient =
        message.includes('408') ||
        message.includes('429') ||
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504') ||
        message.includes('ECONNRESET') ||
        message.includes('ETIMEDOUT') ||
        message.includes('ECONNREFUSED') ||
        message.includes('socket hang up');

      if (!isTransient || attempt === retries) {
        throw err;
      }

      const delay = Math.min(
        delayMs * 2 ** (attempt - 1),
        30000
      );

      console.log(
        `mail.tm transient error ` +
        `(attempt ${attempt}/${retries}): ${message}. ` +
        `Retrying in ${delay}ms...`
      );

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );
    }
  }

  throw lastError;
}

export async function getRandomDomain(): Promise<string> {
  return requestWithRetry(async () => {
    const api = await getContext();

    const res = await api.get('/domains');

    await ensureOk(res, 'get domains');

    const body = await res.json();

    const domains = body['hydra:member'] ?? [];

    const activeDomains = domains.filter(
      (domain: any) => domain.isActive === true
    );

    if (activeDomains.length === 0) {
      throw new Error(
        `No active mail.tm domains available. ` +
        `Raw response: ${JSON.stringify(domains)}`
      );
    }

    const chosen =
      activeDomains[
        Math.floor(Math.random() * activeDomains.length)
      ];

    return chosen.domain;
  });
}

export async function createAccount(
  address: string,
  password: string
): Promise<void> {
  await requestWithRetry(async () => {
    const api = await getContext();

    const res = await api.post('/accounts', {
      data: {
        address,
        password,
      },
    });

    await ensureOk(res, 'account creation');
  });
}

export async function getToken(
  address: string,
  password: string
): Promise<string> {
  return requestWithRetry(async () => {
    const api = await getContext();

    const res = await api.post('/token', {
      data: {
        address,
        password,
      },
    });

    await ensureOk(res, 'get token');

    const body = await res.json();

    if (!body.token) {
      throw new Error(
        'mail.tm token is missing from response'
      );
    }

    return body.token;
  });
}

export async function listMessages(
  token: string
): Promise<MailTmMessage[]> {
  return requestWithRetry(async () => {
    const api = await getContext();

    const res = await api.get('/messages', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await ensureOk(res, 'list messages');

    const body = await res.json();

    return body['hydra:member'] ?? [];
  });
}

export async function getMessageBody(
  token: string,
  messageId: string
): Promise<string> {
  return requestWithRetry(async () => {
    const api = await getContext();

    const res = await api.get(
      `/messages/${messageId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    await ensureOk(res, 'get message');

    const body = await res.json();

    return Array.isArray(body.html)
      ? body.html.join('\n')
      : body.text ?? '';
  });
}

/**
 * Polls the inbox until a message arrives.
 */
export async function waitForMessage(
  token: string,
  options: {
    timeoutMs?: number;
    intervalMs?: number;
  } = {}
): Promise<MailTmMessage> {
  const timeoutMs = options.timeoutMs ?? 60000;
  const intervalMs = options.intervalMs ?? 3000;

  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const messages = await listMessages(token);

      if (messages.length > 0) {
        return messages[0];
      }
    } catch (err: any) {
      console.log(
        `mail.tm polling error: ${err.message}`
      );
    }

    await new Promise((resolve) =>
      setTimeout(resolve, intervalMs)
    );
  }

  throw new Error(
    `No email arrived within ${timeoutMs}ms`
  );
}

/**
 * Extracts the first confirmation/verification link
 * from an HTML email body.
 */
export function extractConfirmationLink(
  htmlBody: string
): string {
  const hrefMatches = [
    ...htmlBody.matchAll(/href="([^"]+)"/g),
  ].map((match) => match[1]);

  const confirmLink = hrefMatches.find((href) =>
    href.includes('globbing.com')
  );

  if (!confirmLink) {
    throw new Error(
      `No confirmation link found. ` +
      `Raw href list: ${hrefMatches.join(', ')}`
    );
  }

  return confirmLink.replace(/&amp;/g, '&');
}

export async function closeMailTmContext(): Promise<void> {
  if (sharedContext) {
    await sharedContext.dispose();
    sharedContext = null;
  }
}