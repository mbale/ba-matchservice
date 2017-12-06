import { dIConnection, dILogger, dIRedisQueues } from 'ba-common';
import { Service, Container } from 'typedi';
import MatchEntity from '../entity/match';
import { Connection } from 'typeorm/connection/Connection';
import * as winston from 'winston';
import * as dotenv from 'dotenv';
import { Job, Queue } from 'bull';

dotenv.config();

const MONGODB_URL = process.env.MATCH_SERVICE_MONGODB_URL;
const REDIS_URL = process.env.MATCH_SERVICE_REDIS_URL;

export enum Queues {
  MatchFetching = 'fetch-matches',
  MatchOddsFetching = 'fetch-match-odds',
  MatchUpdatesFetching = 'fetch-match-updates',
}

/**
 * All of redis related task are in the same place
 * we by now don't have issues with any loss connection
 * 
 * @export
 * @class TaskService
 */
@Service()
export class TaskService {
  constructor(
    // inject db connection and let native mongodb library handle connecion issues (reconnect etc)
    @dIConnection(MONGODB_URL, [MatchEntity], Container) private connection : Connection,
    // inject logger
    @dILogger(MONGODB_URL, winston, Container) private logger: winston.LoggerInstance,
    // bootstrap all redis queues
    @dIRedisQueues(REDIS_URL, Queues, Container) public queueStore: Map<string, Queue>, 
  ) {
    this.logger.info(`Taskservice's successfully connected to redis at: ${REDIS_URL}`);
    this.logger.info(`Queues: ${this.queueStore.size}`);
    for (const [name, queue] of this.queueStore.entries()) {
      this.logger.info(name);
    }
  }
}
