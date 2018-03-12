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
import { ObjectId } from 'bson';
import { sha1 } from 'object-hash';
import {
  MatchOddsType, MatchSourceType,
  TaskService, MatchMapType, MatchStatusType,
  MatchOddsSource,
} from 'ba-common';

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
              source: MatchOddsSource.PINNACLE,
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
      this.logger.info(`Aborting task with id: ${job.id}`);
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

      const {
        updates,
        lastFetchTime,
      } = await this.pinnacleHTTPService.fetchUpdates(previousLast);

      const matchIds = updates.map(u => u.matchId);

      const matches = await matchRepository.find({
        where: {
          '_source.matchId': {
            $in: matchIds,
          },
        },
      });

      let counter = 0;
      for (const update of updates) {
        const match = matches.find(m => m._source.matchId === update.matchId);

        const periods = update.periods;

        if (match) {
          for (const period of periods) {
            const {
              number,
              status,
              team1Score,
              team2Score,
              settledAt,
            } = period;

            match.updates.push({
              mapType: this.pinnaclePeriodNumberToMapType(number),
              statusType: this.pinnaclePeriodStatusToStatusType(status),
              addedAt: new Date(),
              homeTeamScore: team1Score,
              awayTeamScore: team2Score,
              endDate: new Date(settledAt),
            });
            counter = counter += 1;
          }
        }
      }

      this.logger.info(`${counter} fresh updates`);

      // save udated cache
      if (!cache) {
        cache = new CacheEntity();
        cache.taskName = this.fetchPinnacleUpdates.name;
      }

      cache.last = lastFetchTime;

      await cacheRepository.save(cache);

      // sync

      await matchRepository.save(matches);
    } catch (error) {
      this.logger.error(error);
      this.logger.info(`Aborting task with id: ${job.id}`);
      throw error;
    }
  }

  pinnaclePeriodNumberToMapType(period: number): MatchMapType {
    let periodType : MatchMapType = null;

    switch (period) {
      case 0:
        periodType = MatchMapType.Match;
        break;
      case 1:
        periodType = MatchMapType.Map1;
        break;
      case 2:
        periodType = MatchMapType.Map2;
        break;
      case 3:
        periodType = MatchMapType.Map3;
        break;
      case 4:
        periodType = MatchMapType.Map4;
        break;
      case 5:
        periodType = MatchMapType.Map5;
        break;
      case 6:
        periodType = MatchMapType.Map6;
        break;
      case 7:
        periodType = MatchMapType.Map7;
        break;
      default:
        periodType = MatchMapType.Unknown;
        break;
    }

    return periodType;
  }

  pinnaclePeriodStatusToStatusType(status: number): MatchStatusType {
    let statusType: MatchStatusType = null;

    switch (status) {
      case 1:
        statusType = MatchStatusType.Settled;
        break;
      case 2:
        statusType = MatchStatusType.ReSettled;
        break;
      case 3:
        statusType = MatchStatusType.Canceled;
        break;
      case 4:
        statusType = MatchStatusType.ReSettleCancelled;
        break;
      case 5:
        statusType = MatchStatusType.Deleted;
        break;
      default:
        statusType = MatchStatusType.Unknown;
        break;
    }

    return statusType;
  }
}

