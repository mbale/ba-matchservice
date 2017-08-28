import dotenv from 'dotenv';
import Raven from 'raven';
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import initDbConnection from './db.js';
import Transaction from './models/transaction.js';
import Source from './models/source.js';
import PinnacleSource from './sources/pinnacle.js';
import parser from './parser.js';

dotenv.config();

Raven.config(process.env.SENTRY_DSN).install();

async function getLastRequest(source) {
  const requests = await Source
    .sort('-_createdAt')
    .find({
      type: source,
    });

  let lastRequest = null;

  if (requests.length > 0) {
    const {
      lastFetchTime,
    } = await requests[requests.length - 1].get();
    lastRequest = lastFetchTime;
  }

  return {
    type: source,
    lastFetchTime: lastRequest,
  };
}

async function startTransaction(sources, opts) {
  const transaction = new Transaction({
    type: 'match',
    sources,
    opts,
  });

  await transaction.save();
  return transaction;
}

const app = new Koa();
const router = new Router({
  prefix: '/api',
});

router.post('/tasks/match', async (ctx, next) => {
  try {
    const {
      request: {
        body: {
          sources = [],
          opts = {},
        },
      },
    } = ctx;

    const coreDependencies = [
      initDbConnection(),
    ];

    await Promise.all(coreDependencies);
    const transaction = await startTransaction();

    /*
      Get all information from last requests to cache
    */

    const cacheDependencies = [];

    sources.forEach((source) => {
      cacheDependencies.push(getLastRequest(source));
    });

    // get cache before all match
    const caches = await Promise.all(cacheDependencies);

    const lastFetches = {};

    // pair times with source
    caches.forEach((cache) => {
      lastFetches[cache.type] = cache.lastFetchTime;
    });

    /*
      Check what kind of source we need data from
    */

    const sourceDependencies = [];

    for (const source of sources) {
      switch (source) {
      case 'pinnacle':
        sourceDependencies.push(PinnacleSource.getMatches(lastFetches.pinnacle));
        // falls through
      default:
      }
    }

    const matchAggregation = await Promise.all(sourceDependencies);

    /*
      Get information from sources
    */

    let matches = [];

    for (const aggr of matchAggregation) {
      // merging all matches
      matches = matches.concat(aggr.matches);
    }

    for (const match of matches) {
      await parser(match);
    }

    /*
      Save new cache informations
    */

    const freshCacheDependencies = [];

    const freshCaches = matchAggregation.map((aggr) => {
      return {
        type: aggr.type,
        lastFetchTime: aggr.lastFetchTime,
      };
    });

    for (const cache of freshCaches) {
      // https://github.com/vadimdemedes/mongorito/issues/175
      // we can't pass null as value
      const freshCache = new Source(cache);
      freshCacheDependencies.push(freshCache.save());
    }

    await Promise.all(freshCacheDependencies);
    await transaction.setSate('done');

    ctx.body = {
      success: true,
      details: await transaction.get(),
    };
    await next();
  } catch (error) {
    Raven.captureException(error);
    throw ctx.throw(500, '', error);
  }
});

app.use(bodyParser());
app.use(router.routes());

app.listen(process.env.PORT || 4000);
