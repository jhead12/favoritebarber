class CircuitBreaker {
  constructor({ failureThreshold = 5, successThreshold = 2, timeoutMs = 10000, resetMs = 30000 } = {}) {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = 0;
    this.failureThreshold = failureThreshold;
    this.successThreshold = successThreshold;
    this.timeoutMs = timeoutMs;
    this.resetMs = resetMs;
  }

  async exec(fn) {
    const now = Date.now();
    if (this.state === 'OPEN') {
      if (now >= this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        const err = new Error('CircuitBreaker: OPEN');
        err.code = 'CIRCUIT_OPEN';
        throw err;
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('CircuitBreaker: TIMEOUT'), { code: 'CIRCUIT_TIMEOUT' })), this.timeoutMs)),
      ]);

      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure();
      throw err;
    }
  }

  _onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount += 1;
      if (this.successCount >= this.successThreshold) {
        this._close();
      }
    } else {
      this._resetCounts();
    }
  }

  _onFailure() {
    this.failureCount += 1;
    if (this.failureCount >= this.failureThreshold) {
      this._open();
    }
  }

  _open() {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.resetMs;
    this._resetCounts();
  }

  _close() {
    this.state = 'CLOSED';
    this._resetCounts();
  }

  _resetCounts() {
    this.failureCount = 0;
    this.successCount = 0;
  }
}

module.exports = { CircuitBreaker };
