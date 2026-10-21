import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {requestPinned} from '../../src/lib/research/safe-fetch.ts';

test('the pinned transport closes unneeded redirect and error streams', async () => {
  for (const status of [302, 500]) {
    let ended;
    const closed = new Promise(resolve => { ended = resolve; });
    const server = createServer((_req, response) => {
      response.writeHead(status, {Location: '/next', 'Content-Type': 'text/html'});
      const timer = setInterval(() => response.write('x'.repeat(65536)), 2);
      response.on('close', () => { clearInterval(timer); ended(); });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const result = await requestPinned(new URL(`http://example.com:${server.address().port}/`), {address: '127.0.0.1', family: 4}, AbortSignal.timeout(1000));
      assert.equal(result.status, status);
      const stopped = await Promise.race([closed.then(() => true), new Promise(resolve => setTimeout(() => resolve(false), 100))]);
      assert.equal(stopped, true, `HTTP ${status} body must be closed instead of drained`);
    } finally {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
  }
});
