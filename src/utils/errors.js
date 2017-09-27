class AppError extends Error {
  constructor(message) {
    // error constructor call.
    super(message);

    // stacktrace saving
    Error.captureStackTrace(this, this.constructor);

    // just in case we save name of class too
    this.name = this.constructor.name;
  }
}

class ApiKeysUsedError extends AppError {
  constructor(apiKeys) {
    super('All apikeys are used');

    this.apiKeys = apiKeys;
  }
}

export default {
  ApiKeysUsedError,
};
