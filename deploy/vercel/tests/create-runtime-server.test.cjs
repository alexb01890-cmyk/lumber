'use strict';

const assert = require('node:assert/strict');
const { once } = require('node:events');
const http = require('node:http');
const net = require('node:net');
const { test } = require('node:test');
const { createRuntimeServer } = require('../runtime/create-runtime-server.cjs');

const listen = async (server, context) => {
  const sockets = new Set();
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise((resolve) => server.close(resolve));
  });
  return server.address().port;
};

const runtime = async (context, options = {}) => {
  const server = await createRuntimeServer({
    port: 0,
    backendPort: 1,
    host: '127.0.0.1',
    ...options,
  });
  context.after(() => server.close());
  return server;
};

const request = (port, options = {}, body) =>
  new Promise((resolve, reject) => {
    const outgoing = http.request(
      { hostname: '127.0.0.1', port, agent: false, ...options },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () =>
          resolve({
            status: response.statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks),
          }),
        );
        response.on('error', reject);
      },
    );
    outgoing.on('error', reject);
    outgoing.setTimeout(2000, () =>
      outgoing.destroy(new Error('test timeout')),
    );
    outgoing.end(body);
  });

test('startup serves honest retryable HTML before the backend is ready', async (context) => {
  const server = await runtime(context);
  const result = await request(server.address().port, { path: '/' });
  assert.equal(result.status, 503);
  assert.equal(result.headers['retry-after'], '3');
  assert.match(result.headers['cache-control'], /private/);
  assert.match(result.headers['cache-control'], /no-store/);
  assert.match(result.headers['content-type'], /text\/html/);
  assert.match(result.body.toString(), /http-equiv=["']refresh["']/i);
  assert.match(result.body.toString(), /starting|startup|preparing/i);
});

test('health and client config remain unavailable JSON during startup', async (context) => {
  const server = await runtime(context);
  for (const path of ['/healthz', '/client-config', '/healthz?probe=1']) {
    const result = await request(server.address().port, { path });
    assert.equal(result.status, 503);
    assert.match(result.headers['content-type'], /application\/json/);
    assert.equal(typeof JSON.parse(result.body.toString()), 'object');
  }
  const accepted = await request(server.address().port, {
    path: '/other-api',
    headers: { accept: 'application/json' },
  });
  assert.match(accepted.headers['content-type'], /application\/json/);
});

test('startup HEAD returns retry headers without a body', async (context) => {
  const server = await runtime(context);
  const result = await request(server.address().port, { method: 'HEAD' });
  assert.equal(result.status, 503);
  assert.equal(result.headers['retry-after'], '3');
  assert.equal(result.body.length, 0);
});

test('ready proxy preserves origin, credentials, request body and response cookies', async (context) => {
  let received;
  const backendPort = await listen(
    http.createServer((incoming, response) => {
      const chunks = [];
      incoming.on('data', (chunk) => chunks.push(chunk));
      incoming.on('end', () => {
        received = {
          method: incoming.method,
          path: incoming.url,
          headers: incoming.headers,
          body: Buffer.concat(chunks).toString(),
        };
        response.writeHead(201, {
          'content-type': 'application/json',
          'set-cookie': ['first=one; HttpOnly', 'second=two; SameSite=Lax'],
          'x-origin-header': 'present',
        });
        response.end('{"created":true}');
      });
    }),
    context,
  );
  const server = await runtime(context, { backendPort });
  server.markReady();
  const body = '{"quantity":2500}';
  const result = await request(
    server.address().port,
    {
      method: 'POST',
      path: '/rest/orders?return=full',
      headers: {
        host: 'lumber.example.test',
        authorization: 'Bearer test-access-token',
        cookie: 'session=test-session',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
        'x-forwarded-proto': 'https',
      },
    },
    body,
  );
  assert.equal(received.method, 'POST');
  assert.equal(received.path, '/rest/orders?return=full');
  assert.equal(received.headers.host, 'lumber.example.test');
  assert.equal(received.headers.authorization, 'Bearer test-access-token');
  assert.equal(received.headers.cookie, 'session=test-session');
  assert.equal(received.headers['x-forwarded-proto'], 'https');
  assert.equal(received.body, body);
  assert.equal(result.status, 201);
  assert.equal(result.headers['x-origin-header'], 'present');
  assert.deepEqual(result.headers['set-cookie'], [
    'first=one; HttpOnly',
    'second=two; SameSite=Lax',
  ]);
  assert.equal(result.body.toString(), '{"created":true}');
});

test(
  'response bytes stream before the origin finishes',
  { timeout: 5000 },
  async (context) => {
    let finishResponse;
    const backendPort = await listen(
      http.createServer((_incoming, response) => {
        response.writeHead(200, { 'content-type': 'text/event-stream' });
        response.write('data: first\n\n');
        finishResponse = () => response.end('data: last\n\n');
      }),
      context,
    );
    const server = await runtime(context, { backendPort });
    server.markReady();
    const outgoing = http.get({
      hostname: '127.0.0.1',
      port: server.address().port,
      agent: false,
    });
    context.after(() => outgoing.destroy());
    const [response] = await once(outgoing, 'response');
    const [firstChunk] = await once(response, 'data');
    assert.equal(firstChunk.toString(), 'data: first\n\n');
    assert.equal(response.complete, false);
    const ended = once(response, 'end');
    response.resume();
    finishResponse();
    await ended;
  },
);

test(
  'request bytes reach the backend before the upload finishes',
  { timeout: 5000 },
  async (context) => {
    let firstChunkReceived;
    let uploadFinished = false;
    const firstChunk = new Promise((resolve) => (firstChunkReceived = resolve));
    const backendPort = await listen(
      http.createServer((incoming, response) => {
        const chunks = [];
        incoming.once('data', (chunk) => firstChunkReceived(chunk.toString()));
        incoming.on('data', (chunk) => chunks.push(chunk));
        incoming.on('end', () => {
          uploadFinished = true;
          response.end(Buffer.concat(chunks));
        });
      }),
      context,
    );
    const server = await runtime(context, { backendPort });
    server.markReady();
    const outgoing = http.request({
      hostname: '127.0.0.1',
      port: server.address().port,
      method: 'POST',
      agent: false,
    });
    context.after(() => outgoing.destroy());
    const completed = new Promise((resolve, reject) => {
      outgoing.on('error', reject);
      outgoing.on('response', (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks).toString()));
        response.on('error', reject);
      });
    });
    outgoing.write('first part');
    assert.equal(await firstChunk, 'first part');
    assert.equal(uploadFinished, false);
    outgoing.end(' and last part');
    assert.equal(await completed, 'first part and last part');
  },
);

test('compressed binary payloads and their headers pass through unchanged', async (context) => {
  const payload = Buffer.from([31, 139, 8, 0, 0, 255, 10, 13, 0, 127]);
  const backendPort = await listen(
    http.createServer((_incoming, response) => {
      response.writeHead(200, {
        'content-type': 'application/octet-stream',
        'content-encoding': 'gzip',
        'content-length': payload.length,
      });
      response.end(payload);
    }),
    context,
  );
  const server = await runtime(context, { backendPort });
  server.markReady();
  const result = await request(server.address().port);
  assert.deepEqual(result.body, payload);
  assert.equal(result.headers['content-encoding'], 'gzip');
  assert.equal(result.headers['content-length'], String(payload.length));
});

test('an unavailable backend returns a safe retryable response', async (context) => {
  const reserved = net.createServer();
  reserved.listen(0, '127.0.0.1');
  await once(reserved, 'listening');
  const backendPort = reserved.address().port;
  await new Promise((resolve) => reserved.close(resolve));
  const server = await runtime(context, { backendPort });
  server.markReady();
  const result = await request(server.address().port);
  assert.equal(result.status, 503);
  assert.equal(result.headers['retry-after'], '3');
  assert.doesNotMatch(
    result.body.toString(),
    /ECONNREFUSED|127\.0\.0\.1|stack/i,
  );
});

test(
  'aborting a client stream closes its backend request',
  { timeout: 5000 },
  async (context) => {
    let backendClosed;
    const closed = new Promise((resolve) => (backendClosed = resolve));
    const backendPort = await listen(
      http.createServer((_incoming, response) => {
        response.on('close', backendClosed);
        response.write('stream started');
      }),
      context,
    );
    const server = await runtime(context, { backendPort });
    server.markReady();
    const outgoing = http.get({
      hostname: '127.0.0.1',
      port: server.address().port,
      agent: false,
    });
    outgoing.on('error', () => {});
    const [response] = await once(outgoing, 'response');
    response.on('error', () => {});
    response.destroy();
    await closed;
  },
);

test(
  'close is idempotent and terminates active streams',
  { timeout: 5000 },
  async (context) => {
    const backendPort = await listen(
      http.createServer((_incoming, response) => response.write('ongoing')),
      context,
    );
    const server = await runtime(context, { backendPort });
    const port = server.address().port;
    server.markReady();
    const outgoing = http.get({ hostname: '127.0.0.1', port, agent: false });
    outgoing.on('error', () => {});
    const [response] = await once(outgoing, 'response');
    response.on('error', () => {});
    const responseClosed = new Promise((resolve) =>
      response.once('close', resolve),
    );
    await Promise.all([server.close(), server.close(), responseClosed]);
    await assert.rejects(request(port), { code: 'ECONNREFUSED' });
  },
);

test('abort closes the public listener', async (context) => {
  const controller = new AbortController();
  const server = await runtime(context, { signal: controller.signal });
  const port = server.address().port;
  controller.abort();
  await server.close();
  await assert.rejects(request(port), { code: 'ECONNREFUSED' });
});

test('already aborted startup never creates a listener', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    createRuntimeServer({
      port: 0,
      backendPort: 3001,
      host: '127.0.0.1',
      signal: controller.signal,
    }),
  );
});

test('upgrade requests receive a retryable error before readiness', async (context) => {
  const server = await runtime(context);
  const result = await request(server.address().port, {
    headers: { connection: 'Upgrade', upgrade: 'websocket' },
  });
  assert.equal(result.status, 503);
  assert.equal(result.headers['retry-after'], '3');
});

test('ready upgrades return a safe retryable error when the backend refuses the connection', async (context) => {
  const reserved = net.createServer();
  reserved.listen(0, '127.0.0.1');
  await once(reserved, 'listening');
  const backendPort = reserved.address().port;
  await new Promise((resolve) => reserved.close(resolve));
  const server = await runtime(context, { backendPort });
  server.markReady();
  const result = await request(server.address().port, {
    headers: { connection: 'Upgrade', upgrade: 'websocket' },
  });
  assert.equal(result.status, 503);
  assert.equal(result.headers['retry-after'], '3');
  assert.doesNotMatch(
    result.body.toString(),
    /ECONNREFUSED|127\.0\.0\.1|stack/i,
  );
});

test(
  'ready upgrades preserve the handshake and initial buffered bytes',
  { timeout: 5000 },
  async (context) => {
    let received;
    const backend = http.createServer();
    backend.on('upgrade', (incoming, socket, head) => {
      received = incoming.headers;
      socket.write(
        'HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n',
      );
      socket.write(head);
      socket.pipe(socket);
    });
    const backendPort = await listen(backend, context);
    const server = await runtime(context, { backendPort });
    server.markReady();
    const client = net.connect(server.address().port, '127.0.0.1');
    context.after(() => client.destroy());
    await once(client, 'connect');
    const response = new Promise((resolve, reject) => {
      let content = '';
      client.on('data', (chunk) => {
        content += chunk.toString();
        if (content.includes('\r\n\r\ninitial-frame')) resolve(content);
      });
      client.on('error', reject);
    });
    client.write(
      'GET /events HTTP/1.1\r\nHost: lumber.example.test\r\nConnection: Upgrade\r\nUpgrade: websocket\r\nAuthorization: Bearer websocket-token\r\nCookie: session=websocket-cookie\r\n\r\ninitial-frame',
    );
    const result = await response;
    assert.match(result, /^HTTP\/1\.1 101 Switching Protocols\r\n/);
    assert.equal(received.host, 'lumber.example.test');
    assert.equal(received.authorization, 'Bearer websocket-token');
    assert.equal(received.cookie, 'session=websocket-cookie');
    const closed = once(client, 'close');
    await server.close();
    await closed;
  },
);
