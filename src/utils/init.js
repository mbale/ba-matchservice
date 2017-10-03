import dotenv from 'dotenv';
import Queue from 'bull';
import {
  Database,
} from 'mongorito';
import timestamps from 'mongorito-timestamps';
import winston from 'winston';
import {
  MongoDB,
} from 'winston-mongodb'; // autoinject
import Cache from '../models/cache.js';
import Match from '../models/match.js';
import League from '../models/league.js';
import Team from '../models/team.js';
import Game from '../models/game.js';

dotenv.config();

export function initLoggerInstance() {
  const LOGGER_MONGODB_URL = process.env.MATCH_SERVICE_LOGGER_MONGODB_URL;

  const mongodbTransport = new winston.transports.MongoDB({
    level: 'error',
    db: LOGGER_MONGODB_URL,
    collection: 'logs',
    storeHost: true, // origin of log (hostname)
    tryReconnect: true, // we make sure we always log
  });

  const loggerInstance = new winston.Logger({
    transports: [
      new (winston.transports.Console)({ level: 'info' }),
      mongodbTransport,
    ],
  });

  loggerInstance.handleExceptions(mongodbTransport);

  return loggerInstance;
}

const logger = initLoggerInstance();

export async function initRedisConnection() {
  const REDIS_URL = process.env.MATCH_SERVICE_TASK_REDIS_URL;

  const matchFetchingQueue = new Queue('match-fetching', REDIS_URL);
  const scoreUpdatingQueue = new Queue('score-updating', REDIS_URL);
  const oddsUpdatingQueue = new Queue('odds-updating', REDIS_URL);

  logger.info(`Redis's connected to ${REDIS_URL}`);

  return {
    matchFetchingQueue,
    scoreUpdatingQueue,
    oddsUpdatingQueue,
  };
}

export async function initMongoDbConnection() {
  const MONGODB_URL = process.env.MATCH_SERVICE_CORE_MONGODB_URL;

  const db = new Database(MONGODB_URL);
  // connect
  const {
    serverConfig: {
      s: {
        host,
        port,
      },
    },
  } = await db.connect();
  logger.info(`MongoDB's connected at ${host} at ${port}`);

  // plugin
  db.use(timestamps({
    createdAt: '_createdAt',
    updatedAt: '_updatedAt',
  }));
  // registering model
  db.register(Cache);
  db.register(Game);
  db.register(Match);
  db.register(Team);
  db.register(League);

  return db;
}
