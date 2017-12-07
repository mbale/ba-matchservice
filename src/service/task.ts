import * as dotenv from 'dotenv';
import * as winston from 'winston';
import MatchEntity from '../entity/match';
import MatchParserService from './parser';
import PinnacleService from './pinnacle';
import { Connection } from 'typeorm/connection/Connection';
import { Container, Inject, Service } from 'typedi';
import { dIConnection, dILogger, dIRedisQueues, MatchSourceType } from 'ba-common';
import { Job, Queue, JobOptions } from 'bull';
import 'reflect-metadata';

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
  @dIConnection(MONGODB_URL, [MatchEntity], Container)
  private dbConnection: Connection;

  @dILogger(MONGODB_URL, winston, Container)
  private logger: winston.LoggerInstance;

  @dIRedisQueues(REDIS_URL, Queues, Container)
  public queueStore: Map<string, Queue>;
  
  private var: string;

  @Inject()
  private pinnacleHTTPService : PinnacleService;

  async setupTaskHandlers() {
    this.queueStore.get(Queues.MatchFetching)
      .process(MatchSourceType.Pinnacle, job => this.fetchPinnacleMatches(job));
  }

  
  addTask(identifier: string, queue: Queues, data: any, jobOptions?: JobOptions) {
    this.queueStore.get(queue).add(identifier, data, jobOptions);
  }

  async fetchPinnacleMatches(job?: Job) {
    try {
      // this.queueStore.get(Queues.MatchFetching).process('hi', this.matchFetching);
      const connection = await this.dbConnection;
      this.logger.info('hi from taskservice')
      await this.pinnacleHTTPService.fetchMatches();
    } catch (error) {
      console.log(error)
    }
    // console.log(connection.driver.options)
    // const logger = Container.get(TaskService).logger;
    // const connection = await Container.get(TaskService).connection;

    // const mongoRepository = connection.getMongoRepository<MatchEntity>(MatchEntity);
  
    // const pinnacleService = new PinnacleService({
    //   apiKey: API_KEY,
    //   sportId : SPORT_ID,
    //   getMatchesUrl: GET_MATCHES_URL,
    //   getLeaguesUrl: GET_LEAGUES_URL,
    // });
    // const matchParserService = new MatchParserService();

    // const result = await pinnacleService.fetchMatches();

    // result.matches.forEach(m => console.log(m))
    
    // console.log('hi')
    // console.log(job)
  }
}

