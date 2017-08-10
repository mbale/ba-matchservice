import dotenv from 'dotenv';
import Raven from 'raven';
import Joi from 'joi';
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import initDbConnection from './db.js';
import PinnacleSource from './sources/pinnacle.js';
import parser from './parser.js';

const schema = Joi.object().keys({
  homeTeam: Joi.string().required(),
  awayTeam: Joi.string().required(),
  league: Joi.string().required(),
  game: Joi.string().required(),
  date: Joi.string().isoDate().required(),
});

dotenv.config();

//Raven.config(process.env.SENTRY_DSN).install();

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
          algoChecK = {},
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

    await next();
  } catch (error) {
    throw ctx.throw(500, '', error);
  }
});

app.use(bodyParser());
app.use(router.routes());

app.listen(process.env.PORT);
