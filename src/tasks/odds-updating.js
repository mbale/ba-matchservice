import MatchParser from '../core/parser.js';
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
  CompareModeTypes,
  ParserResultTypes,
} from '../utils/types.js';

const logger = initLoggerInstance();

export async function pinnacleOddsFetchingTask(job) {
  await initMongoDbConnection();

  let latestCacheTime = null;
  let latestCache = null;

  latestCache = await getLatestCache(CacheTypes.Odds, CacheSourceTypes.Pinnacle);

  if (latestCache) {
    latestCacheTime = latestCache.time;
  }

  const {
    matches: matchesWithOdds,
    lastFetchTime,
  } = await PinnacleSource.getOdds(latestCacheTime);

  let matchesInDb = await Match.find();
  const matchesToUpdate = [];

  matchesInDb = await Promise.all(matchesInDb.map(match => match.get()));

  for (const {
    id: matchId,
    leagueId,
    odds,
  } of matchesWithOdds) {
    const matchToUpdate = await Match
      .where('_sources')
      .elemMatch({
        type: 'pinnacle',
        matchId,
        leagueId,
      })
      .findOne();

    if (matchToUpdate) {
      matchToUpdate.set('odds', odds);
      matchesToUpdate.push(matchToUpdate.save());
    }
  }

  const rs = await Promise.all(matchesToUpdate);

  // matchesWithOdds.forEach(({
  //   id: matchIdWithOdds,
  //   leagueId: matchLeagueIdWithOdds,
  //   odds: matchOdds,
  // }) => {

  // });
}

