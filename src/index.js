import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import passport from 'passport';
import Strategy from 'passport-local';
import cors from 'cors';
import arena from 'bull-arena';
import {
  initRedisConnection,
  initLoggerInstance,
} from './utils/init.js';
import {
  QueueTypes,
  MatchSourceTypes,
  OddsSourceTypes,
} from './utils/types.js';
import {
  fetchMatchesFromPinnacle,
  fetchMatchesFromOddsgg,
} from './tasks/fetch-matches.js';
import {
  fetchMatchUpdatesFromPinnacle,
} from './tasks/fetch-match-updates.js';
import {
  fetchMatchOddsFromPinnacle,
} from './tasks/fetch-match-odds.js';

dotenv.config();

/*
  Entry
*/

async function main() {
  /*
    Logger
  */

  const LOGGER_MONGODB_URL = process.env.MATCH_SERVICE_LOGGER_MONGODB_URL;

  const logger = initLoggerInstance();

  logger.info(`Logger's connected to ${LOGGER_MONGODB_URL}`);

  try {
    const {
      matchFetchingQueue,
      matchUpdatesFetchingQueue,
      matchOddsFetchingQueue,
    } = await initRedisConnection();

    const HTTP_PORT = process.env.MATCH_SERVICE_HTTP_PORT || 4000;
    const REDIS_URL = process.env.MATCH_SERVICE_TASK_REDIS_URL;

    /*
      Tasks
    */

    matchFetchingQueue.process(MatchSourceTypes.Pinnacle, fetchMatchesFromPinnacle);
    matchFetchingQueue.process(MatchSourceTypes.Oddsgg, fetchMatchesFromOddsgg);
    matchUpdatesFetchingQueue.process(MatchSourceTypes.Pinnacle, fetchMatchUpdatesFromPinnacle);
    matchOddsFetchingQueue.process(MatchSourceTypes.Pinnacle, fetchMatchOddsFromPinnacle);

    const job = { progress() {} };

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
      name: QueueTypes.MatchFetching,
      url: REDIS_URL,
      hostId: 'betacle',
      type: 'bull',
    }, {
      name: QueueTypes.MatchOddsFetching,
      url: REDIS_URL,
      hostId: 'betacle',
      type: 'bull',
    }, {
      name: QueueTypes.MatchUpdatesFetching,
      url: REDIS_URL,
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

    app.post('/api/tasks/bootstrap', bodyParser.json(), (request, response) => {
      matchFetchingQueue.add(MatchSourceTypes.Pinnacle, {}, {
        repeat: {
          cron: '0 * * * *', // every hour
        },
      });

      matchFetchingQueue.add(MatchSourceTypes.Oddsgg, {}, {
        repeat: {
          cron: '* * * * *', // every hour
        },
      });

      matchUpdatesFetchingQueue.add(MatchSourceTypes.Pinnacle, {}, {
        repeat: {
          cron: '15 */2 * * *', // every two hours
        },
      });

      matchOddsFetchingQueue.add(MatchSourceTypes.Pinnacle, {}, {
        repeat: {
          cron: '30 */2 * * *', // every two hours
        },
      });

      return response
        .status(200)
        .send('OK');
    });

    app.use((req, res, next) => {
      const isLoggedIn = req.isAuthenticated();
      if (!isLoggedIn) {
        return res.redirect('/');
      }
      return next();
    }, admin);

    app.listen(HTTP_PORT, function cb() {
      const {
        address,
        port,
      } = this.address();
      logger.info(`HTTP Server is running on ${address} at ${port}`);
    });
  } catch (error) {
    logger.error(error);
  }
}

main();
