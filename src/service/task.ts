import { dIConnection, dILogger, dIRedisQueues } from 'ba-common';
import { Service, Container } from 'typedi';
import MatchEntity from '../entity/match';
import { Connection } from 'typeorm/connection/Connection';
import * as winston from 'winston';
import * as dotenv from 'dotenv';
import { Job, Queue } from 'bull';
import PinnacleService from './pinnacle';

dotenv.config();

const GET_LEAGUES_URL = process.env.MATCH_SERVICE_PINNACLE_GET_LEAGUES_URL;
const GET_MATCHES_URL = process.env.MATCH_SERVICE_PINNACLE_GET_MATCHES_URL;
const SPORT_ID = Number.parseInt(process.env.MATCH_SERVICE_PINNACLE_SPORT_ID, 10);
const API_KEY = process.env.MATCH_SERVICE_PINNACLE_API_KEY;

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

  async matchFetching(job: Job) {
    const pinnacleService = new PinnacleService({
      apiKey: API_KEY,
      sportId : SPORT_ID,
      getMatchesUrl: GET_MATCHES_URL,
      getLeaguesUrl: GET_LEAGUES_URL,
    });

    const matches = await pinnacleService.fetchMatches();
    console.log(matches.matches.length)
    
    console.log('hi')
    // console.log(job)
  }
}

