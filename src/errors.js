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

class ThresholdInvalidError extends AppError {
  constructor(threshold = null) {
    super('Threshold\'s invalid');

    this.threshold = threshold;
  }
}

class KeywordInvalidError extends AppError {
  constructor(keyword = null) {
    super('Keyword\'s invalid');

    this.keyword = keyword;
  }
}

class KeywordDuplicationError extends AppError {
  constructor(keyword = null) {
    super('Keyword\'s already submitted');

    this.keyword = keyword;
  }
}

export default {
  ThresholdInvalidError,
  KeywordInvalidError,
  KeywordDuplicationError,
};
