import postgres from 'postgres';

import { env } from '../config/env';

export const sql = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 5,
});

export async function check(): Promise<void> {
  await sql`SELECT 1`;
}

export async function close(): Promise<void> {
  await sql.end({ timeout: 5 });
}
