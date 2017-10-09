import MatchParser from '../core/parser.js';
import Cache from '../models/cache.js';
import {
  initMongoDbConnection,
  initLoggerInstance,
} from '../utils/init.js';
import PinnacleSource from '../sources/pinnacle.js';
import OddsggSource from '../sources/oddsgg.js';
import {
  getLatestCache,
} from '../utils/helpers.js';
import {
  CacheTypes,
  CacheSourceTypes,
  CompareModeTypes,
  ParserResultTypes,
} from '../utils/types.js';

export async function fetchMatchesFromPinnacle(job) {
  /*
    Init
  */

  const logger = initLoggerInstance();
  await initMongoDbConnection();

  logger.info('Initiating match fetching from pinnacle');

  let {
    data: parserOpts = {},
  } = job;

  if (Object.keys(parserOpts).length === 0) {
    parserOpts = {
      homeTeam: {
        mode: CompareModeTypes.StrictAndSimilar,
        thresholds: {
          dice: 0.8,
          levenshtein: 1,
        },
      },
      awayTeam: {
        mode: CompareModeTypes.StrictAndSimilar,
        thresholds: {
          dice: 0.8,
          levenshtein: 1,
        },
      },
      league: {
        mode: CompareModeTypes.StrictAndSimilar,
        thresholds: {
          dice: 0.7,
          levenshtein: 1,
        },
      },
      game: {
        mode: CompareModeTypes.StrictOnly,
        thresholds: {
          dice: 0.8,
          levenshtein: 2,
        },
      },
      debug: false,
    };
  }

  /*
    Cache
  */

  let latestCacheTime = null;
  let latestCache = null;

  latestCache = await getLatestCache(CacheTypes.Matches, CacheSourceTypes.Pinnacle);

  if (latestCache) {
    latestCacheTime = latestCache.time;
  }

  /*
    Matches
  */

  const {
    matches,
    lastFetchTime,
  } = await PinnacleSource.getMatches(latestCacheTime);

  // pass runtime config for parsing process
  const matchParser = new MatchParser();

  const results = {
    duplicateCount: 0,
    freshCount: 0,
    invalidCount: 0,
  };

  const progressFraction = 100 / matches.length;
  let progressCount = 0;

  for (const match of matches) {
    logger.info(match);
    const result = await matchParser.analyze(match, parserOpts);

    switch (result) {
    case ParserResultTypes.Duplicate:
      results.duplicateCount += 1;
      break;
    case ParserResultTypes.Fresh:
      results.freshCount += 1;
      break;
    case ParserResultTypes.Invalid:
      results.invalidCount += 1;
      break;
    default:
      results.invalidCount += 1;
      break;
    }

    let currentProgress = progressCount + progressFraction;
    if (currentProgress > 100) {
      currentProgress = 100;
    }
    await job.progress(currentProgress);
    progressCount = Math.ceil(currentProgress * 1000) / 1000;
    logger.info(`Task progress: ${progressCount}%`);
  }

  /*
    Cache updating
  */

  latestCache = new Cache({
    type: CacheTypes.Matches,
    source: CacheSourceTypes.Pinnacle,
    time: lastFetchTime,
  });

  latestCache = await latestCache.save();

  logger.info(`Task results: ${JSON.stringify(results)}`);

  return JSON.stringify(results); // due to web interface we need to convert to string
}

export async function fetchMatchesFromOddsgg(job) {
  /*
    Init
  */

  const logger = initLoggerInstance();
  await initMongoDbConnection();

  logger.info('Initiating match fetching from oddsgg');

  let {
    data: parserOpts = {},
  } = job;

  if (Object.keys(parserOpts).length === 0) {
    parserOpts = {
      homeTeam: {
        mode: CompareModeTypes.StrictAndSimilar,
        thresholds: {
          dice: 0.8,
          levenshtein: 1,
        },
      },
      awayTeam: {
        mode: CompareModeTypes.StrictAndSimilar,
        thresholds: {
          dice: 0.8,
          levenshtein: 1,
        },
      },
      league: {
        mode: CompareModeTypes.StrictAndSimilar,
        thresholds: {
          dice: 0.7,
          levenshtein: 1,
        },
      },
      game: {
        mode: CompareModeTypes.StrictOnly,
        thresholds: {
          dice: 0.8,
          levenshtein: 2,
        },
      },
      debug: false,
    };
  }

  /*
    Matches
  */

  const {
    matches,
  } = await OddsggSource.getMatches();

  // pass runtime config for parsing process
  const matchParser = new MatchParser();

  const results = {
    duplicateCount: 0,
    freshCount: 0,
    invalidCount: 0,
  };

  const progressFraction = 100 / matches.length;
  let progressCount = 0;

  for (const match of matches) {
    const result = await matchParser.analyze(match, parserOpts);

    switch (result) {
    case ParserResultTypes.Duplicate:
      results.duplicateCount += 1;
      break;
    case ParserResultTypes.Fresh:
      results.freshCount += 1;
      break;
    case ParserResultTypes.Invalid:
      results.invalidCount += 1;
      break;
    default:
      results.invalidCount += 1;
      break;
    }

    let currentProgress = progressCount + progressFraction;
    await job.progress(currentProgress);
    if (currentProgress > 100) {
      currentProgress = 100;
    }
    progressCount = Math.ceil(currentProgress * 10) / 10;
    logger.info(`Task progress: ${progressCount}%`);
  }

  return JSON.stringify(results); // due to web interface we need to convert to string
}
