import type { CookieOptions, Request, Response } from 'express';

export interface RefreshCookieConfig {
  name: string;
  maxAgeMs: number;
  secure: boolean;
}

const cookieOptions = (
  config: RefreshCookieConfig,
): CookieOptions => ({
  httpOnly: true,
  secure: config.secure,
  sameSite: 'lax',
  path: '/api/v1/auth',
});

export const getRefreshTokenCookie = (
  req: Request,
  config: RefreshCookieConfig,
): string | null => {
  const value = (req.cookies as Record<string, unknown> | undefined)?.[
    config.name
  ];
  return typeof value === 'string' && value.length > 0 ? value : null;
};

export const setRefreshTokenCookie = (
  res: Response,
  token: string,
  config: RefreshCookieConfig,
): void => {
  res.cookie(config.name, token, {
    ...cookieOptions(config),
    maxAge: config.maxAgeMs,
  });
};

export const clearRefreshTokenCookie = (
  res: Response,
  config: RefreshCookieConfig,
): void => {
  res.clearCookie(config.name, cookieOptions(config));
};
