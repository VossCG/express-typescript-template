import { spawnSync } from 'node:child_process';

const run = (command, args) =>
  spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 5_000,
  });

const fail = (messages) => {
  console.error(`\n${messages.join('\n')}\n`);
  process.exit(1);
};

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const docker = run('docker', ['info', '--format', '{{.ServerVersion}}']);

if (docker.error?.code === 'ENOENT') {
  fail(['✗ Docker CLI was not found.', '  Install Docker and start the Docker daemon.']);
}

if (docker.error || docker.status !== 0 || !docker.stdout.trim()) {
  fail([
    '✗ The Docker daemon is not running, so the PostgreSQL container cannot be checked.',
    '  Start Docker Desktop or another Docker daemon.',
    '  Then run: npm run dev',
  ]);
}

console.log('✓ Docker daemon is running');

const compose = run('docker', ['compose', 'ps', '-q', 'postgres']);

if (compose.status !== 0) {
  fail(['✗ Unable to read the PostgreSQL container status.', '  Run: npm run db:up']);
}

const containerId = compose.stdout.trim();

if (!containerId) {
  fail(['✗ The PostgreSQL container is not running.', '  Run: npm run db:up']);
}

let showedWaitingMessage = false;

for (let attempt = 0; attempt < 30; attempt += 1) {
  const inspect = run('docker', [
    'inspect',
    '--format',
    '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}',
    containerId,
  ]);

  if (inspect.status !== 0) {
    fail(['✗ Unable to check PostgreSQL container health.', '  Run: docker compose logs postgres']);
  }

  const [status, health] = inspect.stdout.trim().split('|');

  if (status !== 'running') {
    fail([`✗ PostgreSQL container status is ${status || 'unknown'}.`, '  Run: npm run db:up']);
  }

  if (health === 'healthy' || health === 'none') {
    console.log('✓ PostgreSQL container is running and ready');
    process.exit(0);
  }

  if (health === 'unhealthy') {
    fail(['✗ PostgreSQL container is running but its health check failed.', '  Run: docker compose logs postgres']);
  }

  if (!showedWaitingMessage) {
    console.log('… PostgreSQL is initializing; waiting up to 30 seconds');
    showedWaitingMessage = true;
  }

  await sleep(1_000);
}

fail(['✗ PostgreSQL was not ready within 30 seconds.', '  Run: docker compose logs postgres']);
