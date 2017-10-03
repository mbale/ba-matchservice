import Joi from 'joi';
import {
  PinnaclePeriodNumberTypes,
  PinnaclePeriodStatusTypes,
} from './types.js';
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

export function pinnaclePeriodStatusToType(status) {
  let statusType = null;

  switch (status) {
  case 1:
    statusType = PinnaclePeriodStatusTypes.Settled;
    break;
  case 2:
    statusType = PinnaclePeriodStatusTypes.ReSettled;
    break;
  case 3:
    statusType = PinnaclePeriodStatusTypes.Canceled;
    break;
  case 4:
    statusType = PinnaclePeriodStatusTypes.ReSettleCancelled;
    break;
  case 5:
    statusType = PinnaclePeriodStatusTypes.Deleted;
    break;
  default:
    statusType = PinnaclePeriodStatusTypes.Unknown;
    break;
  }

  return statusType;
}

export function pinnaclePeriodNumberToType(period) {
  let periodType = null;

  switch (period) {
  case 0:
    periodType = PinnaclePeriodNumberTypes.Match;
    break;
  case 1:
    periodType = PinnaclePeriodNumberTypes.Map1;
    break;
  case 2:
    periodType = PinnaclePeriodNumberTypes.Map2;
    break;
  case 3:
    periodType = PinnaclePeriodNumberTypes.Map3;
    break;
  case 4:
    periodType = PinnaclePeriodNumberTypes.Map4;
    break;
  case 5:
    periodType = PinnaclePeriodNumberTypes.Map5;
    break;
  case 6:
    periodType = PinnaclePeriodNumberTypes.Map6;
    break;
  case 7:
    periodType = PinnaclePeriodNumberTypes.Map7;
    break;
  default:
    periodType = PinnaclePeriodNumberTypes.Unknown;
    break;
  }

  return periodType;
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

