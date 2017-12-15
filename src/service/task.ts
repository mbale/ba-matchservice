import CacheEntity from '../entity/cache';
import * as dotenv from 'dotenv';
import MatchParserService from './parser';
import PinnacleHTTPService from './pinnacle';
import { MatchSourceType, TaskService } from 'ba-common';
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
export default class MatchTaskService extends TaskService {
  @inject('connectionmanager')
  private connectionManager: ConnectionManager;
  @inject(PinnacleHTTPService)
  private pinnacleHTTPService: PinnacleHTTPService;
  @inject(MatchParserService)
  private matchParserService: MatchParserService;

  async fetchPinnacleMatches(job?: Job) {
    try {
      this.logger.info(`Starting task: 
      name: ${this.fetchPinnacleMatches.name}
      id: ${job.id}`);
      const connection = this.connectionManager.get();

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

      this.logger.info(`Running MatchParserService`);
  
      for (const match of result.matches.slice(0, 1)) {
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
      this.logger.error(error.message, error);
      this.logger.info(`Aborting task with id: ${job.id}`);
      throw error;
    }
  }
}

