import crypto from 'crypto';

export function validateTelegramInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return false;

  params.delete('hash');
  const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([key, value]) => `${key}=${value}`).join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return computedHash === hash;
}

export function parseTelegramInitData(initData: string) {
  const params = new URLSearchParams(initData);
  const userStr = params.get('user');
  if (!userStr) return null;

  try {
    const user = JSON.parse(userStr);
    return {
      user: {
        id: user.id as number,
        firstName: user.first_name as string,
        lastName: user.last_name as string | undefined,
        username: user.username as string | undefined,
        languageCode: user.language_code as string | undefined,
      },
      authDate: parseInt(params.get('auth_date') || '0', 10),
      hash: params.get('hash') || '',
      queryId: params.get('query_id') || undefined,
    };
  } catch {
    return null;
  }
}
