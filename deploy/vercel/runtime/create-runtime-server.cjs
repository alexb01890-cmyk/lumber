'use strict';

const http = require('node:http');
const net = require('node:net');
const {
  startupResponse,
  startupUpgradeResponse,
} = require('./startup-response.cjs');

const HOP_HEADERS = [
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];
const forwardedHeaders = (headers) => {
  const excluded = new Set([
    ...HOP_HEADERS,
    ...(headers.connection || '')
      .split(',')
      .map((name) => name.trim().toLowerCase()),
  ]);
  return Object.fromEntries(
    Object.entries(headers).filter(
      ([name]) => !excluded.has(name.toLowerCase()),
    ),
  );
};

const createRuntimeServer = async ({
  port,
  backendPort,
  host = '0.0.0.0',
  backendHost = '127.0.0.1',
  signal,
}) => {
  signal?.throwIfAborted();
  let ready = false;
  let closing;
  const connections = new Set();
  const requests = new Set();
  const server = http.createServer((request, response) => {
    if (!ready) return startupResponse(request, response);
    const upstream = http.request({
      hostname: backendHost,
      port: backendPort,
      method: request.method,
      path: request.url,
      headers: forwardedHeaders(request.headers),
      agent: false,
    });
    requests.add(upstream);
    upstream.once('close', () => requests.delete(upstream));
    upstream.once('error', () => {
      if (response.destroyed) return;
      if (response.headersSent) response.destroy();
      else startupResponse(request, response);
    });
    upstream.once('response', (incoming) => {
      if (response.destroyed) return incoming.destroy();
      response.writeHead(
        incoming.statusCode,
        incoming.statusMessage,
        forwardedHeaders(incoming.headers),
      );
      incoming.once('error', () => response.destroy());
      incoming.pipe(response);
    });
    request.once('aborted', () => upstream.destroy());
    request.once('error', () => upstream.destroy());
    response.once('close', () => upstream.destroy());
    request.pipe(upstream);
  });
  server.on('connection', (socket) => {
    connections.add(socket);
    socket.once('close', () => connections.delete(socket));
    socket.on('error', () => {});
  });
  server.on('upgrade', (request, socket, head) => {
    if (!ready) return startupUpgradeResponse(socket);
    socket.pause();
    let responseStarted = false;
    const upstream = net.createConnection({
      host: backendHost,
      port: backendPort,
    });
    connections.add(upstream);
    upstream.once('close', () => connections.delete(upstream));
    upstream.on('data', () => {
      responseStarted = true;
    });
    upstream.once('error', () => {
      if (responseStarted) socket.destroy();
      else startupUpgradeResponse(socket);
    });
    socket.once('close', () => upstream.destroy());
    socket.once('error', () => upstream.destroy());
    upstream.once('connect', () => {
      if (socket.destroyed) return upstream.destroy();
      const headers = [];
      for (let index = 0; index < request.rawHeaders.length; index += 2) {
        headers.push(
          `${request.rawHeaders[index]}: ${request.rawHeaders[index + 1]}`,
        );
      }
      upstream.write(
        `${request.method} ${request.url} HTTP/${request.httpVersion}\r\n${headers.join('\r\n')}\r\n\r\n`,
      );
      if (head.length) upstream.write(head);
      upstream.pipe(socket);
      socket.pipe(upstream);
      socket.resume();
    });
  });
  const close = () => {
    if (closing) return closing;
    ready = false;
    signal?.removeEventListener('abort', abort);
    closing = new Promise((resolve) => {
      server.close(() => resolve());
      for (const request of requests) request.destroy();
      for (const connection of connections) connection.destroy();
    });
    return closing;
  };
  const abort = () => void close();
  signal?.addEventListener('abort', abort, { once: true });
  try {
    await new Promise((resolve, reject) => {
      const cleanup = () => {
        server.removeListener('error', failed);
        server.removeListener('listening', listening);
        signal?.removeEventListener('abort', aborted);
      };
      const failed = () => {
        cleanup();
        reject(
          Object.assign(
            new Error('The startup HTTP listener could not bind.'),
            {
              code: 'VERCEL_PROCESS',
              exitCode: 1,
            },
          ),
        );
      };
      const listening = () => {
        cleanup();
        resolve();
      };
      const aborted = () => {
        cleanup();
        reject(new Error('The startup HTTP listener was stopped.'));
      };
      server.once('error', failed);
      server.once('listening', listening);
      signal?.addEventListener('abort', aborted, { once: true });
      server.listen({ port, host, signal });
    });
  } catch (error) {
    await close();
    throw error;
  }
  return {
    markReady: () => {
      if (!closing) ready = true;
    },
    close,
    address: () => server.address(),
  };
};

module.exports = { createRuntimeServer };
