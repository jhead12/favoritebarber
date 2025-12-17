const pino = require('pino');
const { randomUUID } = require('crypto');

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Create a base logger with serializers and redaction
const logger = pino({
  level: LOG_LEVEL,
  redact: {
    paths: ['req.headers.authorization', 'res.headers.set-cookie'],
    remove: true,
  },
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  serializers: {
    err: pino.stdSerializers.err,
    req(req) {
      return {
        method: req.method,
        url: req.url,
        id: req.id,
        headers: { ...req.headers, authorization: undefined },
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
        headers: res.getHeaders ? res.getHeaders() : undefined,
      };
    },
  },
});

function withCorrelationId(id) {
  return logger.child({ cid: id || randomUUID() });
}

// Express middleware to attach correlation id and log requests
function requestLoggerMiddleware(req, res, next) {
  req.id = req.headers['x-correlation-id'] || randomUUID();
  req.log = withCorrelationId(req.id);
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    req.log.info({
      type: 'http_request',
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration_ms: Math.round(durationMs),
    }, 'HTTP request completed');
  });

  next();
}

// Helper to time external calls and log telemetry
async function logExternalCall({ provider, operation, fn }) {
  const log = logger.child({ provider, operation });
  const start = process.hrtime.bigint();
  try {
    const result = await fn();
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    log.info({ type: 'external_call', success: true, duration_ms: Math.round(durationMs) });
    return result;
  } catch (err) {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    log.error({ type: 'external_call', success: false, duration_ms: Math.round(durationMs), err }, 'External call failed');
    throw err;
  }
}

module.exports = {
  logger,
  withCorrelationId,
  requestLoggerMiddleware,
  logExternalCall,
};
