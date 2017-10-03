import dotenv from 'dotenv';
import Cache from '../models/cache.js';
import Match from '../models/match.js';
import {
  CacheSourceTypes,
  CacheTypes,
} from '../utils/types.js';
import {
  initLoggerInstance,
  initMongoDbConnection,
} from '../utils/init.js';
import {
  getLatestCache,
  pinnaclePeriodNumberToType,
  pinnaclePeriodStatusToType,
} from '../utils/helpers.js';
import PinnacleSource from '../sources/pinnacle.js';

dotenv.config();

export async function pinnacleScoreUpdatingTask(job) {
  /*
    Init
  */

  const logger = initLoggerInstance();
  await initMongoDbConnection();

  logger.info('Initiating score fetching from pinnacle');

  let latestCacheTime = null;
  let latestCache = null;

  /*
    Cache
  */

  latestCache = await getLatestCache(CacheSourceTypes.Matches, CacheTypes.Odds);

  if (latestCache) {
    latestCacheTime = latestCache.time;
  }

  /*
    Scores
  */

  const {
    matches: matchesWithPeriods,
    lastFetchTime,
  } = await PinnacleSource.getScores(latestCacheTime);

  let batchUpdates = [];

  const results = {
    added: 0,
    duplicate: 0,
  };

  const progressFraction = 100 / matchesWithPeriods.length;
  let progressCount = 0;

  for (const { matchId, leagueId, periods } of matchesWithPeriods) {
    let currentProgress = progressCount + progressFraction;
    await job.progress(currentProgress);
    if (currentProgress > 100) {
      currentProgress = 100;
    }
    progressCount = Math.ceil(currentProgress * 10) / 10;
    logger.info(`Updating scores: ${progressCount}%`);
    for (const { number, status, settledAt, team1Score, team2Score } of periods) {
      //
      const matchType = pinnaclePeriodNumberToType(number);
      const statusType = pinnaclePeriodStatusToType(status);
      const endDate = settledAt;
      const scores = {
        homeTeam: team1Score,
        awayTeam: team2Score,
      };
      //

      const matchToUpdate = await Match
        .elemMatch('_sources', (sourceNode) => {
          sourceNode.where('type').equals('pinnacle');
          sourceNode.where('matchId').equals(matchId);
          sourceNode.where('leagueId').equals(leagueId);
        }).findOne();

      // first we check if we have that match
      if (matchToUpdate) {
        const {
          periods: periodsOfMatchToUpdate,
        } = await matchToUpdate.get();

        // then if we have that period already
        const periodIsAlreadyThere = periodsOfMatchToUpdate
          .find(p => p.matchType === matchType
            && p.statusType === statusType
            && p.endDate === endDate);

        if (!periodIsAlreadyThere) {
          periodsOfMatchToUpdate.push({
            matchType,
            statusType,
            endDate,
            scores,
          });

          matchToUpdate.set('periods', periodsOfMatchToUpdate);

          batchUpdates.push(matchToUpdate.save());

          results.added += 1;
        } else {
          results.duplicate += 1;
        }
      }
    }
  }

  batchUpdates = await Promise.all(batchUpdates);

  /*
    Cache updating
  */

  // only save if match db is not empty
  const numberOfMatches = await Match.count();

  if (numberOfMatches !== 0) {
    latestCache = new Cache({
      type: CacheTypes.Scores,
      source: CacheSourceTypes.Pinnacle,
      time: lastFetchTime,
    });
    latestCache = await latestCache.save();
  }

  return JSON.stringify(results); // due to web interface we need to convert to string
}
