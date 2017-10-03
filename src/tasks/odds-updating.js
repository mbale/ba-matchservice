import Cache from '../models/cache.js';
import Match from '../models/match.js';
import {
  initMongoDbConnection,
  initLoggerInstance,
} from '../utils/init.js';
import PinnacleSource from '../sources/pinnacle.js';
import {
  getLatestCache,
} from '../utils/helpers.js';
import {
  CacheTypes,
  CacheSourceTypes,
} from '../utils/types.js';

export async function pinnacleOddsFetchingTask(job) {
  /*
    Init
  */
  const logger = initLoggerInstance();
  await initMongoDbConnection();

  logger.info('Initiating odds fetching from pinnacle');

  let latestCacheTime = null;
  let latestCache = null;

  latestCache = await getLatestCache(CacheTypes.Odds, CacheSourceTypes.Pinnacle);

  if (latestCache) {
    latestCacheTime = latestCache.time;
  }

  /*
    Odds
  */

  const {
    matches: matchesWithOdds,
    lastFetchTime,
  } = await PinnacleSource.getOdds(latestCacheTime);

  const matchesToUpdate = [];

  const results = {
    added: 0,
    invalid: 0,
  };

  const progressFraction = 100 / matchesWithOdds.length;
  let progressCount = 0;

  for (const {
    id: matchId,
    leagueId,
    odds,
  } of matchesWithOdds) {
    let currentProgress = progressCount + progressFraction;

    const matchToUpdate = await Match
      .where('_sources')
      .elemMatch({
        type: 'pinnacle',
        matchId,
        leagueId,
      })
      .findOne();

    if (matchToUpdate) {
      const oddsInDb = await matchToUpdate.get('odds');
      // store last fetch time
      odds.fetchedAt = new Date();

      oddsInDb.push(odds);
      matchToUpdate.set('odds', oddsInDb);

      if (currentProgress > 100) {
        currentProgress = 100;
      }

      await job.progress(currentProgress);
      progressCount = Math.ceil(currentProgress * 1000) / 1000;

      logger.info(`Updating odds: ${progressCount}%`);
      results.added += 1;
      matchesToUpdate.push(matchToUpdate.save());
    } else {
      results.invalid += 1;
    }
  }

  await Promise.all(matchesToUpdate);

  /*
    Cache
  */

  // only save if match db is not empty
  const numberOfMatches = await Match.count();

  if (numberOfMatches !== 0) {
    latestCache = new Cache({
      type: CacheTypes.Odds,
      source: CacheSourceTypes.Odds,
      time: lastFetchTime,
    });

    latestCache = await latestCache.save();
  }

  return JSON.stringify(results); // due to web interface we need to convert to string
}

export async function oddsggOddsFetchingTask(job) {

}

