import { toDate } from 'date-fns';
import { Connection } from 'typeorm/connection/Connection';
import { ConnectionManager } from 'typeorm/connection/ConnectionManager';
import { inject, injectable } from 'inversify';
import {
  TaskService,
} from 'ba-common';
import * as puppeteer from 'puppeteer';
import BrokerService, { RMQActionTypes, RMQExchanges } from '../service/broker';
import { MatchSource, MatchFragment } from '../entity/match';
import { Expose, plainToClass, Transform } from 'class-transformer';

export enum RedisQueues {
  Abios = 'abios',
}

export enum Exchanges {

}

export enum RedisQueueIdentifiers {
  AbiosUpcomingMatchFetching = 'abios-upcoming-match-fetching',
}

export class AUMatchTransform implements MatchFragment {
  @Expose({ name: 'start' })
  @Transform(value => toDate(value * 1000))
  date: Date;

  @Expose({ name: 'game_title' })
  game: string;

  @Expose({ name: 'tournament_title' })
  league: string;

  @Expose({ name: 'compA_name' })
  homeTeam: string;

  @Expose({ name: 'scoreA' })
  homeTeamScore: number;

  @Expose({ name: 'compB_name' })
  awayTeam: string;

  @Expose({ name: 'scoreB' })
  awayTeamScore: number;

  @Transform(value => new Date())
  @Expose()
  addedDate: Date;

  @Transform(value => MatchSource.Abios)
  @Expose()
  source: MatchSource;
}

export interface IAbiosStreamer {
  display_name: string;
  name: string;
  type: number;
  viewers: number;
  alt: string;
  flag: string;
  link: string;
}

export interface IAbiosUpcomingMatch {
  id: number;
  title: string;
  start: number;
  end: number;
  postponed?: any;
  bestOf: number;
  game_id: number;
  tournament_title: string;
  tournament_abbrev: string;
  tournament_info: string;
  substage_title: string;
  substage_id: number;
  substage_type: number;
  stage_title: string;
  stage_id: number;
  scoreA: number;
  scoreB: number;
  compA_name: string;
  compA_abbrev: string;
  compA_flag_alt: string;
  compB_name: string;
  compB_abbrev: string;
  compB_flag_alt: string;
  raceA_folder?: any;
  raceA_filename?: any;
  raceA_alt?: any;
  raceB_folder?: any;
  raceB_filename?: any;
  raceB_alt?: any;
  n_matchups: number;
  sportsbooks: number;
  part: string;
  col: number;
  offset: number;
  uri: string;
  raceA: boolean;
  compA_flag: string;
  raceB: boolean;
  compB_flag: string;
  tournament_link: string;
  thin_logo: string;
  casters: IAbiosStreamer[];
  total_viewers: number;
}

export interface IdentifierHandler {
  identifier: RedisQueueIdentifiers;
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
export default class AbiosTaskService extends TaskService {
  @inject(BrokerService)
  private brokerService: BrokerService;
  @inject(Connection)
  private connection: Connection;

  private urlLiteral
  (skip: number = 0, type: 'upcoming' | 'past' = 'upcoming', take: number = 100) {
    return `https://abiosgaming.com/ajax/calendar-matches?`
      .concat(
        `games[]=&games[]=1&games[]=2&games[]=3&games[]=`,
        `4&games[]=5&games[]=6&games[]=7&games[]=8&games[]=9`,
        `&games[]=10&games[]=11&games[]=12&games[]=13&games[]`,
        `=14&take=${take}&skip=${skip}&${type}=true`,
      );
  }

  async abiosUpcomingMatchFetching () {
    const url = this.urlLiteral(0, 'upcoming', 300);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
      const response = await page.goto(url, { timeout: 100000 });

      if (response.ok()) {
        const abiosMatches: IAbiosUpcomingMatch[] = await response.json();
        // memory usage
        await browser.close();

        for (const abiosMatch of abiosMatches) {
          const aUMatchTransform = plainToClass(
            AUMatchTransform, abiosMatch, { strategy: 'excludeAll' },
          );

          this.brokerService.publish(RMQExchanges.Match, {
            type: RMQActionTypes.MatchCmdValidateData,
            body: {
              match: aUMatchTransform,
            },
          })
        }
      }
    } catch (error) {
      // ssl
      // invalidurl
      // timeout
      // server error
      console.log(error);
    }

    // console.log(cheerio.load(''))
  }
  // @inject(MatchParserService)
  // private matchParserService: MatchParserService;

  // async fetchPinnacleMatches(job?: Job) {
  //   // try {
  //   //   this.logger.info(`Starting task:
  //   //   name: ${this.fetchPinnacleMatches.name}
  //   //   id: ${job.id}`);
  //   //   const connection = this.connectionManager.get();

  //   //   const cacheRepository = connection.getMongoRepository<CacheEntity>(CacheEntity);
  //   //   // const parserLogRepository = connection.getMongoRepository<ParsingLogEntity>(ParsingLogEntity);

  //   //   let cache = await cacheRepository.findOne({
  //   //     taskName: this.fetchPinnacleMatches.name,
  //   //   });

  //   //   const previousLast = cache ? cache.last : null;

  //   //   // const result = await this.pinnacleHTTPService.fetchMatches(previousLast);

  //   //   const parserLog = new ParsingLogEntity();

  //   //   parserLog.taskId = job.id;
  //   //   parserLog.connections = [];

  //   //   this.logger.info(`Running MatchParserService`);

  //   //   for (const match of result.matches) {
  //   //     const hash = sha1(match);
  //   //     const parserResult = await this.matchParserService.run(match);

  //   //     parserLog.connections.push({
  //   //       hash,
  //   //       rawMatch: match,
  //   //       result: parserResult,
  //   //     });

  //   //     this.logger.info(`hash: ${hash}, result: ${parserResult}`);
  //   //   }

  //   //   if (!cache) {
  //   //     cache = new CacheEntity();
  //   //     cache.taskName = this.fetchPinnacleMatches.name;
  //   //   }

  //   //   cache.last = result.lastFetchTime;

  //   //   await cacheRepository.save(cache);

  //   //   await parserLogRepository.save(parserLog);
  //   // } catch (error) {
  //   //   this.logger.error(error.message, error);
  //   //   this.logger.info(`Aborting task with id: ${job.id}`);
  //   //   throw error;
  //   // }
  // }

  // async fetchPinnacleOdds(job?: Job) {
  //   // try {
  //   //   this.logger.info(`Starting task:
  //   //   name: ${this.fetchPinnacleOdds.name}
  //   //   id: ${job.id}`);
  //   //   const connection = this.connectionManager.get();

  //   //   const matchRepository = connection.getMongoRepository<MatchEntity>(MatchEntity);
  //   //   const cacheRepository = connection.getMongoRepository<CacheEntity>(CacheEntity);

  //   //   let cache = await cacheRepository.findOne({
  //   //     taskName: this.fetchPinnacleOdds.name,
  //   //   });

  //   //   const previousLast = cache ? cache.last : null;

  //   //   const {
  //   //     odds,
  //   //     lastFetchTime,
  //   //   } = await this.pinnacleHTTPService.fetchOdds(previousLast);
  //   //   const leagueIds = odds.map(o => o.leagueId);

  //   //   const matches = await matchRepository.find({
  //   //     where: {
  //   //       '_source.leagueId': {
  //   //         $in: leagueIds,
  //   //       },
  //   //     },
  //   //   });

  //   //   let counter = 0;
  //   //   for (const match of matches) {
  //   //     const oddsForMatch = odds
  //   //       // find the correct odds for this match
  //   //       .find(o => o.leagueId === match._source.leagueId && o.id === match._source.matchId);

  //   //     if (oddsForMatch) {
  //   //       // check for what kind of odds we have
  //   //       counter = counter += 1;

  //   //       if (oddsForMatch.odds.moneyline) {
  //   //         match.odds.push({
  //   //           _id: new ObjectId(),
  //   //           fetchedAt: new Date(),
  //   //           home: oddsForMatch.odds.moneyline.home,
  //   //           away: oddsForMatch.odds.moneyline.away,
  //   //           type: MatchOddsType.MoneyLine,
  //   //           source: MatchOddsSource.PINNACLE,
  //   //         });
  //   //       }
  //   //     }
  //   //   }

  //   //   this.logger.info(`${counter} fresh odds`);

  //   //   // save udated cache
  //   //   if (!cache) {
  //   //     cache = new CacheEntity();
  //   //     cache.taskName = this.fetchPinnacleOdds.name;
  //   //   }

  //   //   cache.last = lastFetchTime;

  //   //   await cacheRepository.save(cache);

  //   //   // sync back
  //   //   await matchRepository.save(matches);
  //   // } catch (error) {
  //   //   this.logger.error(error);
  //   //   this.logger.info(`Aborting task with id: ${job.id}`);
  //   //   throw error;
  //   // }
  // }

  // async fetchPinnacleUpdates(job?: Job) {
  //   try {
  //     this.logger.info(`Starting task:
  //     name: ${this.fetchPinnacleUpdates.name}
  //     id: ${job.id}`);
  //     const connection = this.connectionManager.get();

  //     const matchRepository = connection.getMongoRepository<MatchEntity>(MatchEntity);
  //     const cacheRepository = connection.getMongoRepository<CacheEntity>(CacheEntity);

  //     let cache = await cacheRepository.findOne({
  //       taskName: this.fetchPinnacleUpdates.name,
  //     });

  //     const previousLast = cache ? cache.last : null;

  //     const {
  //       updates,
  //       lastFetchTime,
  //     } = await this.pinnacleHTTPService.fetchUpdates(previousLast);

  //     const matchIds = updates.map(u => u.matchId);

  //     const matches = await matchRepository.find({
  //       where: {
  //         '_source.matchId': {
  //           $in: matchIds,
  //         },
  //       },
  //     });

  //     let counter = 0;
  //     for (const update of updates) {
  //       const match = matches.find(m => m._source.matchId === update.matchId);

  //       const periods = update.periods;

  //       if (match) {
  //         for (const period of periods) {
  //           const {
  //             number,
  //             status,
  //             team1Score,
  //             team2Score,
  //             settledAt,
  //           } = period;

  //           match.updates.push({
  //             mapType: this.pinnaclePeriodNumberToMapType(number),
  //             statusType: this.pinnaclePeriodStatusToStatusType(status),
  //             addedAt: new Date(),
  //             homeTeamScore: team1Score,
  //             awayTeamScore: team2Score,
  //             endDate: new Date(settledAt),
  //           });
  //           counter = counter += 1;
  //         }
  //       }
  //     }

  //     this.logger.info(`${counter} fresh updates`);

  //     // save udated cache
  //     if (!cache) {
  //       cache = new CacheEntity();
  //       cache.taskName = this.fetchPinnacleUpdates.name;
  //     }

  //     cache.last = lastFetchTime;

  //     await cacheRepository.save(cache);

  //     // sync

  //     await matchRepository.save(matches);
  //   } catch (error) {
  //     this.logger.error(error);
  //     this.logger.info(`Aborting task with id: ${job.id}`);
  //     throw error;
  //   }
  // }

  // pinnaclePeriodNumberToMapType(period: number): MatchMapType {
  //   let periodType : MatchMapType = null;

  //   switch (period) {
  //     case 0:
  //       periodType = MatchMapType.Match;
  //       break;
  //     case 1:
  //       periodType = MatchMapType.Map1;
  //       break;
  //     case 2:
  //       periodType = MatchMapType.Map2;
  //       break;
  //     case 3:
  //       periodType = MatchMapType.Map3;
  //       break;
  //     case 4:
  //       periodType = MatchMapType.Map4;
  //       break;
  //     case 5:
  //       periodType = MatchMapType.Map5;
  //       break;
  //     case 6:
  //       periodType = MatchMapType.Map6;
  //       break;
  //     case 7:
  //       periodType = MatchMapType.Map7;
  //       break;
  //     default:
  //       periodType = MatchMapType.Unknown;
  //       break;
  //   }

  //   return periodType;
  // }

  // pinnaclePeriodStatusToStatusType(status: number): MatchStatusType {
  //   let statusType: MatchStatusType = null;

  //   switch (status) {
  //     case 1:
  //       statusType = MatchStatusType.Settled;
  //       break;
  //     case 2:
  //       statusType = MatchStatusType.ReSettled;
  //       break;
  //     case 3:
  //       statusType = MatchStatusType.Canceled;
  //       break;
  //     case 4:
  //       statusType = MatchStatusType.ReSettleCancelled;
  //       break;
  //     case 5:
  //       statusType = MatchStatusType.Deleted;
  //       break;
  //     default:
  //       statusType = MatchStatusType.Unknown;
  //       break;
  //   }

  //   return statusType;
  // }
}
