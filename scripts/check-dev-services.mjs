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

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const docker = run('docker', ['info', '--format', '{{.ServerVersion}}']);

if (docker.error?.code === 'ENOENT') {
  fail([
    '✗ 找不到 Docker CLI。',
    '  請先安裝並啟動 Docker Desktop。',
  ]);
}

if (docker.error || docker.status !== 0 || !docker.stdout.trim()) {
  fail([
    '✗ Docker daemon 尚未啟動，因此無法檢查 PostgreSQL 容器。',
    '  macOS 請執行：open -a Docker',
    '  等待 Docker Desktop 完全啟動後，再執行：npm run dev',
  ]);
}

console.log('✓ Docker daemon 已啟動');

const compose = run('docker-compose', ['ps', '-q', 'postgres']);

if (compose.error?.code === 'ENOENT') {
  fail([
    '✗ 找不到 docker-compose 指令。',
    '  請確認 Docker Compose 已正確安裝。',
  ]);
}

if (compose.status !== 0) {
  fail([
    '✗ 無法取得 PostgreSQL 容器狀態。',
    '  請先執行：npm run db:up',
  ]);
}

const containerId = compose.stdout.trim();

if (!containerId) {
  fail([
    '✗ PostgreSQL 容器尚未啟動。',
    '  請先執行：npm run db:up',
  ]);
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
    fail([
      '✗ 無法檢查 PostgreSQL 容器的健康狀態。',
      '  請執行：docker-compose logs postgres',
    ]);
  }

  const [status, health] = inspect.stdout.trim().split('|');

  if (status !== 'running') {
    fail([
      `✗ PostgreSQL 容器目前狀態為 ${status || 'unknown'}。`,
      '  請執行：npm run db:up',
    ]);
  }

  if (health === 'healthy' || health === 'none') {
    console.log('✓ PostgreSQL 容器已啟動且可接受連線');
    process.exit(0);
  }

  if (health === 'unhealthy') {
    fail([
      '✗ PostgreSQL 容器已啟動，但健康檢查失敗。',
      '  請執行：docker-compose logs postgres',
    ]);
  }

  if (!showedWaitingMessage) {
    console.log('… PostgreSQL 正在初始化，最多等待 30 秒');
    showedWaitingMessage = true;
  }

  await sleep(1_000);
}

fail([
  '✗ PostgreSQL 在 30 秒內仍未準備完成。',
  '  請執行：docker-compose logs postgres',
]);
