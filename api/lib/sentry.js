const SENTRY_DSN = process.env.SENTRY_DSN;

let Sentry = null;

function initSentry() {
  if (!SENTRY_DSN) return null;
  try {
    Sentry = require('@sentry/node');
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.0),
    });
    return Sentry;
  } catch (err) {
    // If the package isn't installed or initialization fails, log and continue
    // to avoid blocking startup in local dev.
    // eslint-disable-next-line no-console
    console.warn('Sentry init failed or not installed:', err && err.message ? err.message : err);
    Sentry = null;
    return null;
  }
}

function requestHandler() {
  return (Sentry && Sentry.Handlers && Sentry.Handlers.requestHandler) ? Sentry.Handlers.requestHandler() : (req, res, next) => next();
}

function errorHandler() {
  return (Sentry && Sentry.Handlers && Sentry.Handlers.errorHandler) ? Sentry.Handlers.errorHandler() : (err, req, res, next) => next(err);
}

function captureException(err, ctx) {
  if (Sentry && Sentry.captureException) return Sentry.captureException(err, ctx);
  // fallback: log to console
  // eslint-disable-next-line no-console
  console.error('Captured exception (Sentry disabled):', err);
}

module.exports = { initSentry, requestHandler, errorHandler, captureException };
