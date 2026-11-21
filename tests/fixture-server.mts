// Test-only isolated repository. Never imported by the production frontend or backend.
import { createApp } from '../../backend/src/app.js';
import { config, fixture, dashboard, notifications } from '../../backend/tests/support.js';
const state = await fixture();
const app = await createApp(
  { ...config, APP_ORIGIN: 'http://127.0.0.1:3101' },
  { auth: state.store, dashboard, notifications },
);
await app.listen({ host: '127.0.0.1', port: 4101 });
for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, () => {
    void app.close();
  });
