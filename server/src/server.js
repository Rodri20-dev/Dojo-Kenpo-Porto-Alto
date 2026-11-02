import 'dotenv/config';
import { createServer } from 'node:http';
import { parseEnv } from './config/env.js';
import { createApp } from './app.js';

let config;
try {
  config = parseEnv();
} catch (error) {
  const issues = error.issues?.map(({ path, message }) => ({ path: path.join('.'), message }));
  console.error(JSON.stringify({ event: 'configuration_error', issues }));
  process.exit(1);
}

const server = createServer(createApp(config));
server.listen(config.PORT, () => console.info(JSON.stringify({ event: 'server_started', port: config.PORT, environment: config.NODE_ENV })));

let closing = false;
function shutdown(signal) {
  if (closing) return;
  closing = true;
  console.info(JSON.stringify({ event: 'server_shutdown', signal }));
  server.close((error) => {
    if (error) {
      console.error(JSON.stringify({ event: 'server_close_error', code: error.code }));
      process.exitCode = 1;
    }
  });
  const timeout = setTimeout(() => {
    console.error(JSON.stringify({ event: 'server_shutdown_timeout' }));
    server.closeAllConnections();
    process.exit(1);
  }, 10_000);
  timeout.unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
