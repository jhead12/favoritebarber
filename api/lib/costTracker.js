const { logger } = require('./logger');

class CostTracker {
  constructor({ sink = 'log' } = {}) {
    this.sink = sink;
    this._totals = new Map();
  }

  record({ provider, model, unit = 'requests', cost = 0, quotaCost = 0, tokens = 0, durationMs = 0, success = true }) {
    const key = `${provider}:${model || 'n/a'}`;
    const prev = this._totals.get(key) || { cost: 0, quotaCost: 0, tokens: 0, count: 0 };
    const next = {
      cost: prev.cost + (cost || 0),
      quotaCost: prev.quotaCost + (quotaCost || 0),
      tokens: prev.tokens + (tokens || 0),
      count: prev.count + 1,
    };
    this._totals.set(key, next);

    if (this.sink === 'log') {
      logger.info({ type: 'cost', provider, model, unit, cost, quotaCost, tokens, duration_ms: durationMs, success }, 'Cost tracked');
    }
  }

  totals() {
    return Array.from(this._totals.entries()).map(([key, v]) => ({ key, ...v }));
  }
}

const costTracker = new CostTracker();

module.exports = { CostTracker, costTracker };
