import dotenv from 'dotenv';
import Raven from 'raven';
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import initDbConnection from './db.js';
import Transaction from './models/transaction.js';
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

    if (pinnacle) {
      sourceDependencies.push(PinnacleSource.getMatches());
    }

    const [{
      matches: pinnacleMatches,
      lastFetchTime: lastPinnacleFetch,
    }] = await Promise.all(sourceDependencies);

    for (const match of pinnacleMatches) { // eslint-disable-line
      await parser(match); // eslint-disable-line
    }

    await transaction.setSate('done');
    await next();
  } catch (error) {
    Raven.captureException(error);
    throw ctx.throw(500, '', error);
  }
});

app.use(bodyParser());
app.use(router.routes());

app.listen(process.env.PORT);
