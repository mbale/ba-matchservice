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
  initMongoDbConnection,
  initRedisConnection,
  initLoggerInstance,
} from './init.js';
import {
  pinnacle,
  oddsgg,
} from './tasks/initial-match-fetching.js';

dotenv.config();

/*
  Supported sources
  We use it to validate during task making through rest api
*/

const supportedSources = [
  'pinnacle',
  'oddsgg',
];

/*
  Logger
*/
const LOGGER_MONGODB_URL = process.env.MATCH_SERVICE_LOGGER_MONGODB_URL;

const logger = initLoggerInstance();

logger.info(`Logger's connected to ${LOGGER_MONGODB_URL}`);

/*
  Entry
*/

async function main() {
  try {
    const {
      initialMatchFetching,
      matchReferenceUpdating,
    } = await initRedisConnection();

    const HTTP_PORT = process.env.MATCH_SERVICE_HTTP_PORT || 4000;
    const REDIS_URL = process.env.MATCH_SERVICE_TASK_REDIS_URL;

    await initMongoDbConnection();

    /*
      Tasks
    */

    // pinnacle
    initialMatchFetching.process('pinnacle', pinnacle);
    initialMatchFetching.process('oddsgg', oddsgg);

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
      url: REDIS_URL,
      hostId: 'betacle',
      type: 'bull',
    }, {
      name: 'match-reference-updating',
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

        const taskData = body.parserOpts;

        logger.info('Adding new task', taskData);

        initialMatchFetching.add(body.taskOpts.source, taskData, taskConfig);

        return response
          .status(200)
          .send('OK');
      } catch (error) {
        logger.error(error);
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
