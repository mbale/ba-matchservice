import CacheEntity from '../entity/cache';
import TeamHTTPService from './team';
import * as dotenv from 'dotenv';
import MatchParserService from './parser';
import PinnacleHTTPService from './pinnacle';
import { MatchSourceType, AppError } from 'ba-common';
import { Job, JobOptions, Queue as IQueue } from 'bull';
import { injectable, inject } from 'inversify';
import { Connection } from 'typeorm/connection/Connection';
import { LoggerInstance } from 'winston';
import { ConnectionManager } from 'typeorm/connection/ConnectionManager';
import ParsingLogEntity from '../entity/parsing-log';
import { sha1 } from 'object-hash';

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
    @inject(MatchParserService) private matchParserService: MatchParserService,
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
      const connection = this.dbConnection.get();

      const cacheRepository = connection.getMongoRepository<CacheEntity>(CacheEntity);
      const parserLogRepository = connection.getMongoRepository<ParsingLogEntity>(ParsingLogEntity);

      const cache = await cacheRepository.findOne({
        taskName: this.fetchPinnacleMatches.name,
      });

      let previousLast = null;

      if (cache) {
        previousLast = cache.last;
      }

      const result = await this.pinnacleHTTPService.fetchMatches(previousLast);
    
      const parserLog = new ParsingLogEntity();
  
      parserLog.taskId = job.id;
      parserLog.connections = [];

      this.logger.info(`Running parser service`);
  
      for (const match of result.matches.slice(0, 2)) {
        const hash = sha1(match);
        const parserResult = await this.matchParserService.run(match);
  
        parserLog.connections.push({
          hash,
          rawMatch: match,
          result: parserResult,
        });

        this.logger.info(`
        hash: ${hash},
        result: ${parserResult}`);
      }

      // await parserLogRepository.save(parserLog);
    } catch (error) {
      const e : AppError = error;
      this.logger.error(e.message, e);
      throw error;
    }
  }
}

