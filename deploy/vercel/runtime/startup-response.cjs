'use strict';

const STARTUP_MESSAGE =
  'The CRM is starting. Please try again in a few seconds.';
const STARTUP_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="3"><title>CRM starting</title></head><body><p>${STARTUP_MESSAGE}</p></body></html>`;
const STARTUP_HEADERS = {
  'cache-control': 'private, no-store',
  'retry-after': '3',
  'x-content-type-options': 'nosniff',
};

const startupResponse = (request, response) => {
  const pathname = request.url?.split('?')[0];
  const json =
    pathname === '/healthz' ||
    pathname === '/client-config' ||
    request.headers.accept?.includes('application/json');
  const body = json
    ? JSON.stringify({ status: 'starting', message: STARTUP_MESSAGE })
    : STARTUP_HTML;
  response.writeHead(503, {
    ...STARTUP_HEADERS,
    'content-type': json
      ? 'application/json; charset=utf-8'
      : 'text/html; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  });
  response.end(request.method === 'HEAD' ? undefined : body);
};

const startupUpgradeResponse = (socket) => {
  if (socket.destroyed || !socket.writable) return;
  socket.end(
    [
      'HTTP/1.1 503 Service Unavailable',
      'Connection: close',
      'Cache-Control: private, no-store',
      'Retry-After: 3',
      'Content-Type: text/plain; charset=utf-8',
      `Content-Length: ${Buffer.byteLength(STARTUP_MESSAGE)}`,
      '',
      STARTUP_MESSAGE,
    ].join('\r\n'),
  );
};

module.exports = { startupResponse, startupUpgradeResponse };
