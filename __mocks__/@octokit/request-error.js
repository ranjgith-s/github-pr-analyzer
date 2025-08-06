// Mock for @octokit/request-error to handle ESM issues
class RequestError extends Error {
  constructor(message, status, options = {}) {
    super(message);
    this.name = 'RequestError';
    this.status = status;
    this.request = options.request || {};
    this.response = options.response || {};
  }
}

module.exports = {
  RequestError,
};
