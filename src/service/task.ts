import * as dotenv from 'dotenv';
import CacheEntity from '../entity/cache';
import MatchParserService from './parser';
import ParsingLogEntity from '../entity/parsing-log';
import PinnacleHTTPService from './pinnacle';
import { Connection } from 'typeorm/connection/Connection';
import { ConnectionManager } from 'typeorm/connection/ConnectionManager';
import { inject, injectable } from 'inversify';
import { Job, JobOptions, Queue as IQueue } from 'bull';
import { LoggerInstance } from 'winston';
import { MatchEntity } from '../entity/match';
import { MatchOddsType, MatchSourceType, TaskService } from 'ba-common';
import { sha1 } from 'object-hash';
import { ObjectId } from 'bson';

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

      let cache = await cacheRepository.findOne({
        taskName: this.fetchPinnacleMatches.name,
      });

      const previousLast = cache ? cache.last : null;

      const result = await this.pinnacleHTTPService.fetchMatches(previousLast);

      const parserLog = new ParsingLogEntity();

      parserLog.taskId = job.id;
      parserLog.connections = [];

      this.logger.info(`Running MatchParserService`);

      for (const match of result.matches) {
        const hash = sha1(match);
        const parserResult = await this.matchParserService.run(match);

        parserLog.connections.push({
          hash,
          rawMatch: match,
          result: parserResult,
        });

        this.logger.info(`hash: ${hash}, result: ${parserResult}`);
      }

      if (!cache) {
        cache = new CacheEntity();
        cache.taskName = this.fetchPinnacleMatches.name;
      }

      cache.last = result.lastFetchTime;

      await cacheRepository.save(cache);

      await parserLogRepository.save(parserLog);
    } catch (error) {
      this.logger.error(error.message, error);
      this.logger.info(`Aborting task with id: ${job.id}`);
      throw error;
    }
  }

  async fetchPinnacleOdds(job?: Job) {
    try {
      this.logger.info(`Starting task:
      name: ${this.fetchPinnacleOdds.name}
      id: ${job.id}`);
      const connection = this.connectionManager.get();

      const matchRepository = connection.getMongoRepository<MatchEntity>(MatchEntity);
      const cacheRepository = connection.getMongoRepository<CacheEntity>(CacheEntity);

      let cache = await cacheRepository.findOne({
        taskName: this.fetchPinnacleOdds.name,
      });

      const previousLast = cache ? cache.last : null;

      const {
        odds,
        lastFetchTime,
      } = await this.pinnacleHTTPService.fetchOdds(previousLast);
      const leagueIds = odds.map(o => o.leagueId);

      const matchBuffer = [];

      const matches = await matchRepository.find({
        where: {
          '_source.leagueId': {
            $in: leagueIds,
          },
        },
      });

      let counter = 0;
      for (const match of matches) {
        const oddsForMatch = odds
          // find the correct odds for this match
          .find(o => o.leagueId === match._source.leagueId && o.id === match._source.matchId);

        if (oddsForMatch) {
          // check for what kind of odds we have
          counter = counter += 1;

          if (oddsForMatch.odds.moneyline) {
            match.odds.push({
              _id: new ObjectId(),
              fetchedAt: new Date(),
              home: oddsForMatch.odds.moneyline.home,
              away: oddsForMatch.odds.moneyline.away,
              type: MatchOddsType.MoneyLine,
            });
          }
        }
      }

      this.logger.info(`${counter} fresh odds`);

      // save udated cache
      if (!cache) {
        cache = new CacheEntity();
        cache.taskName = this.fetchPinnacleOdds.name;
      }

      cache.last = lastFetchTime;

      await cacheRepository.save(cache);

      // sync back
      await matchRepository.save(matches);
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async fetchPinnacleUpdates(job?: Job) {
    try {
      this.logger.info(`Starting task:
      name: ${this.fetchPinnacleUpdates.name}
      id: ${job.id}`);
      const connection = this.connectionManager.get();

      const matchRepository = connection.getMongoRepository<MatchEntity>(MatchEntity);
      const cacheRepository = connection.getMongoRepository<CacheEntity>(CacheEntity);

      let cache = await cacheRepository.findOne({
        taskName: this.fetchPinnacleUpdates.name,
      });

      const previousLast = cache ? cache.last : null;

    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}

