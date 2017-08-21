import dotenv from 'dotenv';
import Raven from 'raven';
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import initDbConnection from './db.js';
import Transaction from './models/transaction.js';
import Source from './models/pinnacle.js';
import PinnacleSource from './sources/pinnacle.js';
import parser from './parser.js';

dotenv.config();

Raven.config(process.env.SENTRY_DSN).install();

const app = new Koa();
const router = new Router({
  prefix: '/api',
});


router.post('/tasks/match', async (ctx, next) => {
  try {
    const {
      request: {
        body: {
          sources = {},
          opts = {},
        },
      },
    } = ctx;

    const {
      pinnacle = false,
    } = sources;

    const coreDependencies = [
      initDbConnection(),
    ];

    await Promise.all(coreDependencies);

    const sourceDependencies = [];

    const transaction = new Transaction({
      type: 'match',
      matchSources: sources,
      opts,
      result: {},
    });

    await transaction.save();

    let lastPinnacleEntry = null;

    if (pinnacle) {
      const pinnacleData = await Source
        .sort('-_createdAt')
        .find({
          type: 'pinnacle',
        });

      if (pinnacleData.length > 0) {
        const {
          lastFetchTime,
        } = await pinnacleData[pinnacleData.length - 1].get();
        lastPinnacleEntry = lastFetchTime;
      }
    }

    // get all source
    for (const source in sources) {
      switch (source) {
      case 'pinnacle':
        sourceDependencies.push(PinnacleSource.getMatches(lastPinnacleEntry));
        // falls through
      default:
      }
    }

    const [{
      matches: pinnacleMatches,
      lastFetchTime: lastPinnacleFetch,
    }] = await Promise.all(sourceDependencies);

    for (const match of pinnacleMatches) {
      await parser(match);
    }

    if (lastPinnacleFetch) {
      // it's null if there was no new data since
      const pinnacleData = new Source({
        type: 'pinnacle',
        lastFetchTime: lastPinnacleFetch,
      });

      await pinnacleData.save();
    }

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

app.listen(process.env.PORT);
