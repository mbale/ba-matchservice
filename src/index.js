import path from 'path';
import dotenv from 'dotenv';
import Raven from 'raven';
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import passport from 'passport';
import Strategy from 'passport-local';
import cors from 'cors';
import Queue from 'bull';
import arena from 'bull-arena';
import Types from './types.js';
import initDbConnection from './db.js';
import MatchParser from './parser.js';
import Cache from './models/cache.js';
import PinnacleSource from './sources/pinnacle.js';
import OddsggSource from './sources/oddsgg.js';

const {
  ModeTypes,
} = Types;

dotenv.config();

Raven.config(process.env.SENTRY_DSN).install();

const supportedSources = [
  'pinnacle',
  'oddsgg',
];

async function getLatestCache(source) {
  const requests = await Cache
    .sort('-_createdAt')
    .find({
      type: source,
    });

  let latestCache = null;

  if (requests.length > 0) {
    latestCache = await requests[requests.length - 1].get();
  }

  return latestCache;
}

/*
  Main
*/

async function main() {
  await initDbConnection();

  const HTTP_PORT = process.env.PORT || 4000;
  const REDIS_URI = process.env.REDIS_URI || 'redis://redistogo:c3a75af9f438c7653a4a31b546590f41@crestfish.redistogo.com:10276/';

  /*
    Tasks
  */

  const redisQueues = {
    initialMatchFetching: new Queue('initial-match-fetching', REDIS_URI),
  };

  /*
    Pinnacle
  */
  redisQueues.initialMatchFetching.process('pinnacle', async (job) => {
    /*
      0.) Job options
    */

    const {
      data: parserOpts,
    } = job;

    /*
      1.) Get latest cache if any
    */

    let latestCacheTime = null;
    let latestCache = null;

    // we won't save cache in debug
    if (!parserOpts.debug) {
      latestCache = await getLatestCache('pinnacle');

      if (latestCache) {
        latestCacheTime = latestCache.time;
      }
    }

    /*
      2.) Get matches
    */

    const {
      matches,
      lastFetchTime,
    } = await PinnacleSource.getMatches(latestCacheTime);

    /*
      3.) Match parsing
    */

    const results = {
      duplicateCount: 0,
      freshCount: 0,
      invalidCount: 0,
    };

    const progressFraction = 100 / matches.length;
    let progressCount = 0;

    // pass runtime config for parsing process
    const matchParser = new MatchParser(parserOpts);

    for (const match of matches) {
      const {
        type,
      } = await matchParser.analyze(match);

      switch (type) {
      case 0:
        results.duplicateCount += 1;
        break;
      case 1:
        results.freshCount += 1;
        break;
      default:
        results.invalidCount += 1;
        break;
      }

      const currentProgress = progressCount + progressFraction;
      await job.progress(currentProgress);
      progressCount = currentProgress;
    }

    /*
      4.) Cache updating
    */

    if (!parserOpts.debug) {
      latestCache = new Cache({
        type: 'pinnacle',
        time: lastFetchTime,
      });

      latestCache = await latestCache.save();
    }

    /*
      5.) Results
    */

    return JSON.stringify(results); // due to web interface we need to convert to string
  });

  /*
    Oddsgg
  */

  redisQueues.initialMatchFetching.process('oddsgg', async (job) => {
    const {
      data: parserOpts,
    } = job;
    /*
      1.) Get matches
    */

    const {
      matches,
    } = await OddsggSource.getMatches();

    /*
      2.) Match parsing
    */

    const matchParser = new MatchParser(parserOpts);

    const results = {
      duplicateCount: 0,
      freshCount: 0,
      invalidCount: 0,
    };

    const progressFraction = 100 / matches.length;
    let progressCount = 0;

    for (const match of matches) {
      const {
        type,
      } = await matchParser.analyze(match);

      switch (type) {
      case 0:
        results.duplicateCount += 1;
        break;
      case 1:
        results.freshCount += 1;
        break;
      default:
        results.invalidCount += 1;
        break;
      }

      const currentProgress = progressCount + progressFraction;
      await job.progress(currentProgress);
      progressCount = currentProgress;
    }

    /*
      3.) Results
    */

    return JSON.stringify(results); // due to web interface we need to convert to string
  });

  /*
    Http
  */

  passport.use(new Strategy(async (username, password, done) => {
    if (username === 'bali' && password === 'devbali') {
      return done(null, {
        username,
      });
    }

    if (username === 'seb' && password === 'devseb') {
      return done(null, {
        username,
      });
    }
    return done(null, false, {
      message: 'Incorrect credentials.',
    });
  }));

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  const queues = [{
    name: 'initial-match-fetching',
    url: 'redis://redistogo:c3a75af9f438c7653a4a31b546590f41@crestfish.redistogo.com:10276/',
    hostId: 'betacle',
    type: 'bull',
  }];

  const admin = arena({
    queues,
  }, {
    basePath: '/admin',
    disableListen: true,
  });

  const app = express();

  app.set('views', path.join(__dirname, 'http/views'));
  app.set('view engine', 'pug');

  app.use(bodyParser.urlencoded({
    extended: true,
  }));

  app.use(session({
    secret: '123',
    resave: false,
    saveUninitialized: false,
  }));

  app.use(cors());

  app.use(passport.initialize());
  app.use(passport.session());

  app.post('/login', passport.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/',
    failureFlash: false },
  ));

  app.get('/', (request, response) => {
    response.render('login');
  });

  app.post('/api/tasks/initial-match-fetching', bodyParser.json(), (request, response) => {
    try {
      const {
        body,
      } = request;

      if (!body || Object.keys(body).length === 0) {
        return response
          .status(400)
          .send('Empty or bad POST data.');
      }

      if (!body.taskOpts) {
        return response
          .status(400)
          .send('Missing "taskOpts" key.');
      }

      if (!body.taskOpts.source ||
        !supportedSources.includes(body.taskOpts.source)) {
        return response
          .status(400)
          .send('Missing or invalid source');
      }

      if (!body.taskOpts.cron) {
        return response
            .status(400)
            .send('Missing cron.');
      }

      const taskConfig = {
        repeat: {
          cron: body.taskOpts.cron,
        },
      };

      const taskData = body.parserOpts || {};

      redisQueues.initialMatchFetching.add(body.taskOpts.source, taskData, taskConfig);

      return response
        .status(200)
        .send('OK');
    } catch (error) {
      return response
        .status(500)
        .send('We fucked up something');
    }
  });


  app.use((req, res, next) => {
    const isLoggedIn = req.isAuthenticated();
    if (!isLoggedIn) {
      return res.redirect('/');
    }
    return next();
  }, admin);

  app.listen(HTTP_PORT);
}

main();

