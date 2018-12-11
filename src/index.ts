import * as dotenv from 'dotenv';
import * as Queue from 'bull';
import * as rabbot from 'rabbot';
import * as winston from 'winston';
import Match from './entity/match';
import Odds from './entity/odds';
import Score from './entity/score';
import { Container } from 'inversify';
import BrokerService, {
  RMQActionTypes, RMQQueues, RMQExchanges, RMQExchangeTypes,
} from './service/broker';
import { Queue as IQueue } from 'bull';
import { Map } from 'immutable';
import { rabbitMQConfig } from 'ba-common';
import 'winston-mongodb';
import 'reflect-metadata';
import {
  Connection,
  ConnectionManager,
  ConnectionOptions,
} from 'typeorm';
import AbiosTaskService, {
  IdentifierHandler, RedisQueues, RedisQueueIdentifiers,
} from './service/task';

dotenv.config();

const MONGODB_URL = process.env.MATCH_SERVICE_MONGODB_URL;
const DB_URI = process.env.MATCH_SERVICE_DB_URI;
const MATCH_SERVICE_REDIS_URL = process.env.MATCH_SERVICE_REDIS_URL;
const HTTP_PORT = Number.parseInt(process.env.MATCH_SERVICE_API_PORT, 10);
const RABBITMQ_URI = process.env.RABBITMQ_URI;
const GET_LEAGUES_URL = process.env.MATCH_SERVICE_PINNACLE_GET_LEAGUES_URL;
const GET_MATCHES_URL = process.env.MATCH_SERVICE_PINNACLE_GET_MATCHES_URL;
const GET_ODDS_URL = process.env.MATCH_SERVICE_PINNACLE_GET_ODDS_URL;
const GET_UPDATES_URL = process.env.MATCH_SERVICE_PINNACLE_GET_SCORES_URL;
const SPORT_ID = Number.parseInt(process.env.MATCH_SERVICE_PINNACLE_SPORT_ID, 10);
const API_KEY = process.env.MATCH_SERVICE_PINNACLE_API_KEY;
const TEAM_SERVICE_URL = process.env.TEAM_SERVICE_URL;

const IsProd = process.env.NODE_ENV === 'production';

async function main() {
  const container = new Container({
    autoBindInjectable: false,
  });

  /*
    Logger
  */

  const logger = new winston.Logger({
    transports: [
      new (winston.transports.Console)({
        level: 'info',
      }),
    ],
  });

  container.bind(winston.Logger).toConstantValue(logger);
  // ba common reference
  container.bind('logger').toConstantValue(logger);
  logger.info(`Logging's OK`);

  /*
    Database
  */

  const dbOptions: ConnectionOptions = {
    entities: [
      Match, Odds, Score,
    ],
    type: 'postgres',
    url: DB_URI,
    logging: [
      'query',
      'error',
    ],
    migrations: ['src/migrations/*.ts'],
    cli: {
      migrationsDir: 'src/migrations',
      entitiesDir: 'src/entities',
    },
    synchronize: !IsProd,
  };

  // initiate connection so binding is awaiting until it's done
  // => we don't need initializer call in every contained instance
  const connection = new ConnectionManager().create(dbOptions);
  await connection.connect();

  container.bind(Connection).toConstantValue(connection);
  logger.info(`DB's OK`);

  /*
    RabbitMQ
  */

  const exchanges = [
    {
      name: RMQExchanges.Match,
      type: RMQExchangeTypes.Topic,
      persistent: true,
    },
  ];

  const queues = [
    {
      name: RMQQueues.ValidateMatchData,
      autoDelete: false,
      durable: true,
      subscribe: true,
    },
    {
      name: RMQQueues.ValidateMatchIntegrity,
      autoDelete: false,
      durable: true,
      subscribe: true,
      limit: 1, // due to data integrity we need prefetch limit of 1
    },
  ];

  const bindings = [
    {
      exchange: RMQExchanges.Match,
      target: RMQQueues.ValidateMatchData,
      keys: [
        RMQActionTypes.MatchCmdValidateData,
      ],
    },
    {
      exchange: RMQExchanges.Match,
      target: RMQQueues.ValidateMatchIntegrity,
      keys: [
        RMQActionTypes.MatchCmdValidateIntegrity,
      ],
    },
  ];

  await rabbot.configure(
    rabbitMQConfig(RABBITMQ_URI, exchanges, queues, bindings,
  ));

  container.bind<rabbot>(rabbot).toConstantValue(rabbot);

  container.bind<BrokerService>(BrokerService).toSelf();

  /*
    Redis
  */

  const handlerStore = Map<RedisQueues, IdentifierHandler[]>()
    // here handlers needs to be wired
    .set(RedisQueues.Abios, [{
      identifier: RedisQueueIdentifiers.AbiosUpcomingMatchFetching,
      handler: 'abiosUpcomingMatchFetching',
    }])
    // .set(Queues.MatchOddsFetching, [{
    //   identifier: MatchSourceType.Pinnacle,
    //   handler: 'fetchPinnacleOdds',
    // }])
    // .set(Queues.MatchUpdatesFetching, [{
    //   identifier: MatchSourceType.Pinnacle,
    //   handler: 'fetchPinnacleUpdates',
    // }]);

  let queueStore: Map<string, IQueue> = Map();

  for (const [varName, queueName] of Object.entries(RedisQueues)) {
    const queue = new Queue(queueName, MATCH_SERVICE_REDIS_URL);
    queueStore = queueStore.set(queueName, queue);

    // make the tasks if there is none
    if (await queue.count() === 0) {
      logger.info('Adding default tasks');
      switch (queueName) {
        case RedisQueues.Abios:
          // queue.add(MatchSource.Abios.toString(), {}, {
          //   repeat: {
          //     cron: '*/10 * * * *', // every ten minutes
          //   },
          // });
          queue.add(RedisQueueIdentifiers.AbiosUpcomingMatchFetching, {});
          break;
        // case Queues.MatchOddsFetching:
        //   queue.add(MatchSourceType.Pinnacle, {}, {
        //     repeat: {
        //       cron: '*/30 * * * *', // every 30th minute
        //     },
        //   });
        //   queue.add(MatchSourceType.Pinnacle, {});
        //   break;
        // case Queues.MatchUpdatesFetching:
        //   queue.add(MatchSourceType.Pinnacle, {}, {
        //     repeat: {
        //       cron: '*/30 * * * *', // every 30th minute
        //     },
        //   });
        //   queue.add(MatchSourceType.Pinnacle, {});
        default:
          break;
      }
    }
  }

  /*
    Rest of the bindings
  */

  container.bind('handlerstore').toConstantValue(handlerStore);
  container.bind('queuestore').toConstantValue(queueStore);

  logger.info(`HandlerStore's OK`);
  logger.info(`QueueStore's OK`);

  container.bind<AbiosTaskService>(AbiosTaskService).toSelf();

  container.get(AbiosTaskService);
  logger.info(`AbiosTaskService's OK`);

  // migration
  // DO NOT DELETE
  // occasionally we may need external package dependant
  // migration which cannot be resolved through mongo shell
  // and needs to run in live
  // const repo = connectionManager.get().getMongoRepository(MatchEntity);
  // const cursor = repo.createEntityCursor();

  // const buffer = []
  // while (await cursor.hasNext()) {
  //   const match: Match = await cursor.next();

  //   match.urlId = nanoid(7);
  //   buffer.push(match);
  // }
  // await repo.save(buffer);

  /*
    REST API
  */

  // const app = express();

  // useExpressServer(app, {
  //   // cors: true,
  //   validation: true,
  //   middlewares: [LoggingMiddleware],
  // });

  // app.listen(HTTP_PORT, () => {
  //   logger.info(`API's listening on ${HTTP_PORT}`);
  // });

  // routing controllers will get any resolution from our global store
  // useContainer(container);

  logger.info(`Container's bootstrapped`);

  return container;
}

main();
