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

class InvalidSchemaError extends Error {
  constructor(schemaname, data, error) {
    super(`schema: ${schemaname} validation failed with error: ${error}`);

    this.schema = schemaname;
    this.data = data;
    this.error = error;
  }
}

class UnknownCorrelationIdError extends AppError {
  constructor(correlationId = null, type = null) {
    super('Correlation Id\'s not found');

    this.correlationId = correlationId;
    this.type = type;
  }
}

class ApiKeysUsedError extends AppError {
  constructor(apiKeys) {
    super('All apikeys are used')

    this.apiKeys = apiKeys;
  }
}

export default {
  UnknownCorrelationIdError,
  InvalidSchemaError,
  ApiKeysUsedError,
};
