import PinnacleSource from '../sources/pinnacle.js';
import Cache from '../models/cache.js';
import Match from '../models/match.js';
import {
  MatchUpdateDuplicationError,
  InvalidSchemaBySourceError,
  MatchNotFoundBySourceError,
} from '../utils/errors.js';
import {
  initLoggerInstance,
  initMongoDbConnection,
} from '../utils/init.js';
import {
  pinnaclePeriodStatusToType,
  pinnaclePeriodNumberToType,
  getLatestCache,
} from '../utils/helpers.js';
import {
  CacheTypes,
  CacheSourceTypes,
  MatchSourceTypes,
} from '../utils/types.js';

export async function fetchMatchUpdatesFromPinnacle(job) {
  /*
    Init
  */
  const logger = initLoggerInstance();
  await initMongoDbConnection();

  logger.info('Initiating fetching matches task from pinnacle');

  let latestCacheTime = null;
  let latestCache = null;

  latestCache = await getLatestCache(CacheTypes.MatchUpdates, CacheSourceTypes.Pinnacle);

  if (latestCache) {
    latestCacheTime = latestCache.time;
  }

  let results = {
    freshCount: 0, // added to db
    invalidCount: 0, // can't process
    duplicateCount: 0, // already got it
    missingCount: 0, // we don't have reference to it
  };

  try {
    /*
      Fetcher
    */

    const {
      matches: matchesWithPeriods,
      lastFetchTime,
    } = await PinnacleSource.getPeriods(latestCacheTime);

    let updatesBatchSave = [];

    // progress
    const progressFraction = 100 / matchesWithPeriods.length;
    let progressCount = 0;

    for (const { matchId, leagueId, periods } of matchesWithPeriods) {
      try {
        let currentProgress = progressCount + progressFraction;

        if (currentProgress > 100) {
          currentProgress = 100;
        }

        progressCount = Math.ceil(currentProgress * 100) / 100;

        logger.info(`Task progress: ${progressCount}%`);

        // await job.progress(currentProgress);

        // validate
        if (!matchId || !leagueId || !periods.length === 0) {
          throw new InvalidSchemaBySourceError(MatchSourceTypes.Pinnacle,
            matchId, leagueId, JSON.stringify(periods));
        }

        const match = await Match
          .elemMatch('_sources', (matchNode) => {
            matchNode.where('type').equals(MatchSourceTypes.Pinnacle);
            matchNode.where('matchId').equals(matchId);
            matchNode.where('leagueId').equals(leagueId);
          })
          .findOne();

        if (!match) {
          throw new MatchNotFoundBySourceError(MatchSourceTypes.Pinnacle, matchId, leagueId);
        }

        const {
          updates,
          _id: matchIdInDb,
        } = await match.get();

        for (const { number, status, settledAt: endDate, team1Score, team2Score } of periods) {
          try {
            // validate
            if (typeof number === 'undefined' || typeof status === 'undefined'
              || typeof endDate === 'undefined' || typeof team1Score === 'undefined'
              || typeof team2Score === 'undefined') {
              throw new InvalidSchemaBySourceError(MatchSourceTypes.Pinnacle, number,
                status, endDate, team1Score, team2Score);
            }

            // duplicate check
            const sameUpdate = updates.find(u => u.statusType === pinnaclePeriodStatusToType(status)
              && new Date(u.endDate).getTime() === new Date(endDate).getTime());

            // we have the same update already
            if (sameUpdate) {
              throw new MatchUpdateDuplicationError(matchIdInDb, sameUpdate, updates);
            }

            const mapType = pinnaclePeriodNumberToType(number);
            const statusType = pinnaclePeriodStatusToType(status);
            const homeTeamScore = team1Score;
            const awayTeamScore = team2Score;

            const update = {
              mapType,
              statusType,
              endDate,
              homeTeamScore,
              awayTeamScore,
              addedAt: new Date(),
            };

            results.freshCount += 1;
            updates.push(update);
          } catch (error) {
            if (error instanceof InvalidSchemaBySourceError) {
              results.invalidCount += 1;
              logger.info('Skipping invalid update');
            } else if (error instanceof MatchUpdateDuplicationError) {
              results.duplicateCount += 1;
              logger.info('Skipping dupe update');
            } else {
              logger.error(error);
            }
          }
        }

        match.set('updates', updates);
        updatesBatchSave.push(match.save());
      } catch (error) {
        if (error instanceof MatchNotFoundBySourceError) {
          results.missingCount += 1;
          logger.info('Skipping missing match');
        } else if (error instanceof InvalidSchemaBySourceError) {
          results.invalidCount += 1;
          logger.info('Skipping invalid schema');
        } else {
          logger.error(error);
        }
      }
    }

    updatesBatchSave = await Promise.all(updatesBatchSave);

    /*
      Update cache
    */

    latestCache = new Cache({
      type: CacheTypes.MatchUpdates,
      source: CacheSourceTypes.Pinnacle,
      time: lastFetchTime,
    });

    results = JSON.stringify(results);

    logger.info(`Task results: ${results}`);

    latestCache = await latestCache.save();

    return results;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}
