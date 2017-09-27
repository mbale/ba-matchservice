import Joi from 'joi';
import Cache from '../models/cache.js';
import Errors from './errors.js';

const {
  InvalidSchemaError,
} = Errors;

export function validateSchema(data, schemaname, schema) {
  const {
    error,
  } = Joi.validate(data, schema);

  if (error) {
    throw new InvalidSchemaError(schemaname, data, error);
  }
}

export async function getLatestCache(type, source) {
  const requests = await Cache
    .sort('-_createdAt')
    .find({
      type,
      source,
    });

  let latestCache = null;

  if (requests.length > 0) {
    latestCache = await requests[requests.length - 1].get();
  }

  return latestCache;
}

