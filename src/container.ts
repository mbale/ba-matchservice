import * as dotenv from 'dotenv';
import * as express from 'express';
import * as qs from 'qs';
import * as Queue from 'bull';
import * as winston from 'winston';
import axios from 'axios';
import CacheEntity from './entity/cache';
import LeagueEntity from './entity/league';
import MatchHTTPController from './gateway/api';
import MatchParserService from './service/parser';
import ParsingLogEntity from './entity/parsing-log';
import PinnacleHTTPService, { PinnacleHTTPServiceOpts } from './service/pinnacle';
import {
  Connection,
  ConnectionManager,
  ConnectionOptions,
  createConnection,
  } from 'typeorm';
import { Container } from 'inversify';
import { Job, JobOptions, Queue as IQueue } from 'bull';
import { List, Map } from 'immutable';
import { MatchEntity } from './entity/match';
import { MatchSourceType, TeamHTTPService, LoggingMiddleware } from 'ba-common';
import { useContainer, useExpressServer } from 'routing-controllers';
import MatchTaskService, {
  IdentifierHandler,
} from './service/task';
import 'winston-mongodb';
// inject

dotenv.config();

const MONGODB_URL = process.env.MATCH_SERVICE_MONGODB_URL;
const MATCH_SERVICE_REDIS_URL = process.env.MATCH_SERVICE_REDIS_URL;
const HTTP_PORT = Number.parseInt(process.env.MATCH_SERVICE_API_PORT, 10);

const GET_LEAGUES_URL = process.env.MATCH_SERVICE_PINNACLE_GET_LEAGUES_URL;
const GET_MATCHES_URL = process.env.MATCH_SERVICE_PINNACLE_GET_MATCHES_URL;
const GET_ODDS_URL = process.env.MATCH_SERVICE_PINNACLE_GET_ODDS_URL;
const GET_UPDATES_URL = process.env.MATCH_SERVICE_PINNACLE_GET_SCORES_URL;
const SPORT_ID = Number.parseInt(process.env.MATCH_SERVICE_PINNACLE_SPORT_ID, 10);
const API_KEY = process.env.MATCH_SERVICE_PINNACLE_API_KEY;

const TEAM_SERVICE_URL = process.env.TEAM_SERVICE_URL;

async function main() {
  const container = new Container({
    autoBindInjectable: false,
  });

  /*
    Logger
  */

  const logger = new winston.Logger({
    transports: [
      new (winston.transports.Console)({ level: 'info' }),
      new winston.transports.MongoDB({
        level: 'error',
        db: MONGODB_URL,
        collection: 'logs',
        storeHost: true, // origin of log (hostname)
        tryReconnect: true, // we make sure we always log
      }),
    ],
  });

  logger.transports.mongodb.on('error', err => logger.info(err));
  logger.unhandleExceptions(logger.transports.mongdob);
  container.bind('logger').toConstantValue(logger);
  logger.info(`Logging's OK`);

  /*
    Axios
  */

  const axiosInstance = axios.create({
    baseURL: `${TEAM_SERVICE_URL}`,
    paramsSerializer(param) {
      // by default axios convert same query params into array in URL e.g. ids=[]
      return qs.stringify(param, { indices: false });
    },
  });

  container.bind('axios').toFunction(axiosInstance);
  logger.info(`Axios's OK`);

  /*
    Database
  */

  const dbOptions : ConnectionOptions = {
    entities: [MatchEntity, LeagueEntity, CacheEntity, ParsingLogEntity],
    type: 'mongodb',
    url: MONGODB_URL,
    logging: ['query', 'error'],
  };

  const connectionManager = new ConnectionManager();
  // initiate connection so binding is awaiting until it's done
  // => we don't need initializer call in every contained instance
  await connectionManager.create(dbOptions).connect();

  container.bind('connectionmanager').toConstantValue(connectionManager);
  logger.info(`DB's OK`);

  /*
    HTTPService
  */

  const pinnacleHTTPServiceOptions: PinnacleHTTPServiceOpts = {
    apiKey: API_KEY,
    getLeaguesUrl: GET_LEAGUES_URL,
    getMatchesUrl: GET_MATCHES_URL,
    getOddsUrl: GET_ODDS_URL,
    getUpdatesUrl: GET_UPDATES_URL,
    sportId: SPORT_ID,
  };

  container.bind('pinnaclehttpservice.options').toConstantValue(pinnacleHTTPServiceOptions);
  container.bind('httpservice.name').toConstantValue(PinnacleHTTPService.name);

  container.bind<PinnacleHTTPService>(PinnacleHTTPService).toSelf();
  logger.info(`PinnacleHTTPService's OK`);
  container.rebind('httpservice.name').toConstantValue(TeamHTTPService.name);
  logger.info(`TeamHTTPService's OK`);
  container.bind<TeamHTTPService>(TeamHTTPService).toSelf();

  /*
    ParserService
  */

  container.bind<MatchParserService>(MatchParserService).toSelf();
  logger.info(`MatchParserService's OK`);

  /*
    Redis and injecting tasks
  */

  enum Queues {
    MatchFetching = 'fetch-matches',
    MatchOddsFetching = 'fetch-match-odds',
    MatchUpdatesFetching = 'fetch-match-updates',
  }

  const handlerStore = Map<Queues, IdentifierHandler[]>()
    // here handlers needs to be wired
    .set(Queues.MatchFetching, [{
      identifier: MatchSourceType.Pinnacle,
      handler: 'fetchPinnacleMatches',
    }])
    .set(Queues.MatchOddsFetching, [{
      identifier: MatchSourceType.Pinnacle,
      handler: 'fetchPinnacleOdds',
    }])
    .set(Queues.MatchUpdatesFetching, [{
      identifier: MatchSourceType.Pinnacle,
      handler: 'fetchPinnacleUpdates',
    }]);

  let queueStore: Map<string, IQueue> = Map();

  for (const [varName, queueName] of Object.entries(Queues)) {
    const queue = new Queue(queueName, MATCH_SERVICE_REDIS_URL);
    queueStore = queueStore.set(queueName, queue);

    // make the tasks if there is none
    if (await queue.count() === 0) {
      logger.info('Adding default tasks');
      switch (queueName) {
        case Queues.MatchFetching:
          queue.add(MatchSourceType.Pinnacle, {}, {
            repeat: {
              cron: '*/10 * * * *', // every ten minutes
            },
          });
          // queue.add(MatchSourceType.Pinnacle, {});
          break;
        case Queues.MatchOddsFetching:
          queue.add(MatchSourceType.Pinnacle, {}, {
            repeat: {
              cron: '*/30 * * * *', // every 30th minute
            },
          });
          // queue.add(MatchSourceType.Pinnacle, {});
          break;
        case Queues.MatchUpdatesFetching:
          queue.add(MatchSourceType.Pinnacle, {}, {
            repeat: {
              cron: '*/30 * * * *', // every 30th minute
            },
          });
          // queue.add(MatchSourceType.Pinnacle, {});
        default:
          break;
      }
    }
  }

  container.bind('handlerstore').toConstantValue(handlerStore);
  container.bind('queuestore').toConstantValue(queueStore);

  logger.info(`HandlerStore's OK`);
  logger.info(`QueueStore's OK`);

  container.bind<MatchTaskService>(MatchTaskService).toSelf();

  container.get(MatchTaskService);
  logger.info(`MatchTaskService's OK`);

  /*
    REST API
  */

  container.bind<MatchHTTPController>(MatchHTTPController).toSelf();
  logger.info(`MatchHTTPController's OK`);
  container.bind(LoggingMiddleware).toSelf();
  logger.info(`LoggingMiddleware's OK`);

  const app = express();

  useExpressServer(app, {
    // cors: true,
    validation: true,
    middlewares: [LoggingMiddleware],
  });

  app.listen(HTTP_PORT, () => {
    logger.info(`API's listening on ${HTTP_PORT}`);
  });

  // routing controllers will get any resolution from our global store
  useContainer(container);

  logger.info(`Container's bootstrapped`);

  return container;
}

export default main;
