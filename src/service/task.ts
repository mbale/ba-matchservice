import CacheEntity from '../entity/cache';
import TeamHTTPService from './team';
import * as dotenv from 'dotenv';
import MatchParserService from './parser';
import PinnacleHTTPService from './pinnacle';
import { MatchSourceType } from 'ba-common';
import { Job, JobOptions, Queue as IQueue } from 'bull';
import { injectable, inject } from 'inversify';
import { Connection } from 'typeorm/connection/Connection';
import { LoggerInstance } from 'winston';
import { ConnectionManager } from 'typeorm/connection/ConnectionManager';

export interface IdentifierHandler {
  identifier: MatchSourceType;
  handler: string;
}

/**
 * All of redis related task are in the same place
 * we by now don't have issues with any loss connection
 * 
 * @export
 * @class TaskService
 */
@injectable()
export default class MatchTaskService {
  constructor(
    @inject(PinnacleHTTPService) private pinnacleHTTPService: PinnacleHTTPService,
    @inject(TeamHTTPService) private teamHTTPService: TeamHTTPService,
    @inject(ConnectionManager) private dbConnection: ConnectionManager,
    @inject('logger') private logger: LoggerInstance,
    @inject('queuestore') public queueStore: Map<string, IQueue>,
    @inject('handlerstore') private handlerStore: Map<string, IdentifierHandler[]>,
  ) {
    this.logger.info('Taskservice');
    this.logger.info('Queue names:');
    this.queueStore.forEach((queue, queuename) => this.logger.info(queuename));
  
    const ownProperties = Object
      .getOwnPropertyNames(MatchTaskService.prototype)
      .filter(prop => !prop.includes('constructor'));
  
    this.logger.info('Queue handlers:');
    this.handlerStore.forEach((handlers, queuename) => {
      handlers.forEach((identifierObj) => {
        // check if class contains handler for it and it has the correct queuename
        if (ownProperties.includes(identifierObj.handler) && queueStore.has(queuename)) {
          queueStore.get(queuename)
            .process(identifierObj.identifier, job => this[identifierObj.handler](job));
          this.logger.info(`identifier: ${identifierObj.identifier}`);
          this.logger.info(`handler: ${identifierObj.handler}`);
        }
      });
    });
  }

  async fetchPinnacleMatches(job?: Job) {
    try {
      this.logger.info(`Starting task: 
      name: ${this.fetchPinnacleMatches.name}
      id: ${job.id}`);
      const connection = this.dbConnection.get()

      const cacheRepository = connection.getMongoRepository<CacheEntity>(CacheEntity);

      const cache = await cacheRepository.findOne({
        taskName: this.fetchPinnacleMatches.name,
      });

      let previousLast = null;

      if (cache) {
        previousLast = cache.last;
      }

      const result = await this.pinnacleHTTPService.fetchMatches(previousLast);
      throw new Error('yo');
    } catch (error) {
      console.log(error)
      this.logger.error('error', function() {});
      throw error;
    }

    // const result = await pinnacleService.fetchMatches();

    // result.matches.forEach(m => console.log(m))
    
    // console.log('hi')
    // console.log(job)
  }
}

