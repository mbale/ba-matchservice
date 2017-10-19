import {
  ObjectId,
} from 'mongorito';
import PinnacleSource from '../sources/pinnacle.js';
import Match from '../models/match.js';
import Cache from '../models/cache.js';
import {
  InvalidSchemaBySourceError,
  MatchNotFoundBySourceError,
  OddsDuplicationError,
} from '../utils/errors.js';
import {
  initLoggerInstance,
  initMongoDbConnection,
} from '../utils/init.js';
import {
  getLatestCache,
} from '../utils/helpers.js';
import {
  CacheTypes,
  CacheSourceTypes,
  OddsSourceTypes,
  MatchSourceTypes,
  BetTypes,
} from '../utils/types.js';

export async function fetchMatchOddsFromPinnacle(job) {
  const logger = initLoggerInstance();
  await initMongoDbConnection();

  logger.info('Initiating odds fetching from pinnacle task');

  let latestCacheTime = null;
  let latestCache = null;

  latestCache = await getLatestCache(CacheTypes.Odds, CacheSourceTypes.Pinnacle);

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
      matches: matchesWithOdds,
      lastFetchTime,
    } = await PinnacleSource.getOdds(latestCacheTime);

    let oddsBatchSave = [];

    // progress
    const progressFraction = 100 / matchesWithOdds.length;
    let progressCount = 0;

    for (const { id: matchId, leagueId, odds: { moneyline } } of matchesWithOdds) {
      try {
        // validate
        if (!matchId || !leagueId || !moneyline) {
          throw new InvalidSchemaBySourceError(OddsSourceTypes.Pinnacle, matchId, leagueId, moneyline);
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
          odds: oddsInDb,
          _id: matchIdInDb,
        } = await match.get();

        // moneyline check
        const sameMoneyline = oddsInDb.find(m =>
          m.type === BetTypes.MoneyLine
          && m.home === moneyline.home
          && m.away === moneyline.away);

        if (sameMoneyline) {
          throw new OddsDuplicationError(matchIdInDb, BetTypes.MoneyLine, moneyline, oddsInDb);
        }

        // add id
        moneyline._id = new ObjectId();
        // add type
        moneyline.type = BetTypes.MoneyLine;
        // add fetch date
        moneyline.fetchedAt = new Date();

        // save
        oddsInDb.push(moneyline);
        match.set('odds', oddsInDb);

        oddsBatchSave.push(match.save());

        // progress
        results.freshCount += 1;
        let currentProgress = progressCount + progressFraction;

        if (currentProgress > 100) {
          currentProgress = 100;
        }

        await job.progress(currentProgress);
        progressCount = Math.ceil(currentProgress * 1000) / 1000;

        logger.info(`Saving odds progress: ${progressCount}%`);
      } catch (error) {
        if (error instanceof InvalidSchemaBySourceError) {
          results.invalidCount += 1;
          logger.info('Skipping invalid odds');
        } else if (error instanceof MatchNotFoundBySourceError) {
          results.missingCount += 1;
          logger.info('Skipping missing match');
        } else if (error instanceof OddsDuplicationError) {
          results.duplicateCount += 1;
          logger.info('Skipping dupe odds');
        } else {
          logger.error(error);
        }
      }
    }

    oddsBatchSave = await Promise.all(oddsBatchSave);

    /*
      Update cache
    */

    latestCache = new Cache({
      type: CacheTypes.Odds,
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
