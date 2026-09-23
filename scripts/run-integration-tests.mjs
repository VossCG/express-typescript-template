import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';

const adminUrl = process.env.TEST_DATABASE_URL;

if (!adminUrl) {
  console.error('Set TEST_DATABASE_URL to a PostgreSQL database with CREATE DATABASE permission.');
  process.exit(1);
}

const databaseName = `backend_template_test_${randomUUID().replaceAll('-', '')}`;
const testUrl = new URL(adminUrl);
testUrl.pathname = `/${databaseName}`;

const adminSql = postgres(adminUrl, { max: 1 });
let databaseCreated = false;

const run = (command, args, env) => {
  const result = spawnSync(command, args, { stdio: 'inherit', env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
};

try {
  await adminSql.unsafe(`CREATE DATABASE "${databaseName}"`);
  databaseCreated = true;

  const testEnv = { ...process.env, DATABASE_URL: testUrl.toString(), NODE_ENV: 'test' };
  run('npm', ['exec', '--', 'dbmate', '--no-dump-schema', 'up'], testEnv);
  run(process.execPath, ['--test', 'build/test/test/task.integration.js'], testEnv);
} finally {
  try {
    if (databaseCreated) {
      await adminSql.unsafe(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
    }
  } finally {
    await adminSql.end();
  }
}
