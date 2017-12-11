import CacheEntity from './entity/cache';
import MatchTaskService, {
  IdentifierHandler,
} from './service/task';
import axios from 'axios';
import { Container } from 'inversify';
import TeamHTTPService from './service/team';
import * as dotenv from 'dotenv';
import * as qs from 'qs';
import PinnacleHTTPService, { PinnacleHTTPServiceOpts } from './service/pinnacle';
import * as winston from 'winston';
import MatchParserService from './service/parser';
import { Connection } from 'typeorm/connection/Connection';
import { ConnectionOptions, createConnection, useContainer } from 'typeorm';
import { ConnectionManager } from 'typeorm/connection/ConnectionManager';
import { Map, List } from 'immutable';
import * as Queue from 'bull';
import { Job, JobOptions, Queue as IQueue } from 'bull';
import { MatchSourceType } from 'ba-common';
import { MatchEntity } from './entity/match';
import LeagueEntity from './entity/league';

dotenv.config();

const TEAM_SERVICE_URL = process.env.TEAM_SERVICE_URL;
const MONGODB_URL = process.env.MATCH_SERVICE_MONGODB_URL;

const GET_LEAGUES_URL = process.env.MATCH_SERVICE_PINNACLE_GET_LEAGUES_URL;
const GET_MATCHES_URL = process.env.MATCH_SERVICE_PINNACLE_GET_MATCHES_URL;
const SPORT_ID = Number.parseInt(process.env.MATCH_SERVICE_PINNACLE_SPORT_ID, 10);
const API_KEY = process.env.MATCH_SERVICE_PINNACLE_API_KEY;

const MATCH_SERVICE_REDIS_URL = process.env.MATCH_SERVICE_REDIS_URL;

async function main() {
  const container = new Container({
    autoBindInjectable: false,
  });
  
  /*
    Set up dependencies
  */
  
  const axiosInstance = axios.create({
    baseURL: `${TEAM_SERVICE_URL}`,
    paramsSerializer(param) {
      // by default axios convert same query params into array in URL e.g. ids=[] 
      return qs.stringify(param, { indices: false });
    },
  });

  container.bind('axios').toFunction(axiosInstance);

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

  logger.transports.mongodb.on('error', err => console.log(err));

  // logger.unhandleExceptions(winston.transports.MongoDB);

  container.bind('logger').toConstantValue(logger);
  
  const dbOptions : ConnectionOptions = {
    entities: [MatchEntity, LeagueEntity, CacheEntity],
    type: 'mongodb',
    url: MONGODB_URL,
    logging: ['query', 'error'],
  };

  const connectionManager = new ConnectionManager();
  // initiate connection so binding is awaiting until it's done 
  // => we don't need initializer call in every contained instance
  await connectionManager.create(dbOptions).connect();
  container.bind(ConnectionManager).toConstantValue(connectionManager);
  
  const pinnacleHTTPServiceOptions: PinnacleHTTPServiceOpts = {
    apiKey: API_KEY,
    getLeaguesUrl: GET_LEAGUES_URL,
    getMatchesUrl: GET_MATCHES_URL,
    sportId: SPORT_ID,
  };
  
  container.bind('pinnaclehttpservice.options').toConstantValue(pinnacleHTTPServiceOptions);
  container.bind<PinnacleHTTPService>(PinnacleHTTPService).toSelf();

  container.bind<TeamHTTPService>(TeamHTTPService).toSelf();
  
  container.bind<MatchParserService>(MatchParserService).toSelf();

  /*
    Redis
  */

  enum Queues {
    MatchFetching = 'fetch-matches',
    MatchOddsFetching = 'fetch-match-odds',
    MatchUpdatesFetching = 'fetch-match-updates',
  }
  
  const handlerStore = Map<Queues, IdentifierHandler[]>()
    .set(Queues.MatchFetching, [{
      identifier: MatchSourceType.Pinnacle,
      handler: 'fetchPinnacleMatches',
    }]);

  let queueStore: Map<string, IQueue> = Map();

  for (const [varName, queueName] of Object.entries(Queues)) {
    queueStore = queueStore.set(queueName, new Queue(queueName, MATCH_SERVICE_REDIS_URL));
  }

  container.bind('handlerstore').toConstantValue(handlerStore);
  container.bind('queuestore').toConstantValue(queueStore);
  
  container.bind<MatchTaskService>(MatchTaskService).toSelf();

  container.get(MatchTaskService)
    .queueStore.get(Queues.MatchFetching).add(MatchSourceType.Pinnacle, {})

  useContainer(container);

  return container;
}

export default main;
