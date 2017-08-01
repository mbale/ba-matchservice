import dotenv from 'dotenv';
import amqplib from 'amqplib';
import {
  Database,
} from 'mongorito';
import timestamps from 'mongorito-timestamps';
import Raven from 'raven';
import Joi from 'joi';
import Utils from '~/utils.js';
import MatchService from '~/match.js';
import LeagueService from '~/league.js';
import TeamService from '~/team.js';

const schema = Joi.object().keys({
  homeTeam: Joi.string().required(),
  awayTeam: Joi.string().required(),
  league: Joi.string().required(),
  game: Joi.string().required(),
  date: Joi.string().isoDate().required(),
});

dotenv.config();

Raven.config(process.env.SENTRY_DSN).install();

/*
  Queue declarations
 */
const QueueTypes = {
  CREATE_MATCH: 'matches',
  FAILED_MATCH: 'failed_matches',
};

/*
  Db
 */
async function initDbConnection() {
  const db = new Database(process.env.MONGODB_URI);
  // connect
  await db.connect();

  // plugin
  db.use(timestamps());
  // registering model
  db.register(MatchService.model);
  db.register(TeamService.model);
  db.register(LeagueService.model);
}

async function initRabbitMQConnection() {
  const connection = await amqplib.connect(process.env.RABBITMQ_URI);
  const channel = await connection.createChannel();
  /*
    Creating queues that service depends on
   */
  await channel.assertQueue(QueueTypes.CREATE_MATCH);
  await channel.assertQueue(QueueTypes.FAILED_MATCH);

  // one by one
  await channel.prefetch(1);
  return channel;
}

/*
  Entry
 */
async function main() {
  /*
    Bootstrap core dependencies
   */
  await initDbConnection();
  const channel = await initRabbitMQConnection();

  /*
    Consumers
  */
  channel.consume(QueueTypes.CREATE_MATCH, async (message) => {
    try {
      const {
        content: matchData,
      } = Utils.getContentAsJSON(message);

      console.log(matchData);

      if (process.env.VALIDATE_BASE === 'true') {
        Utils.validateSchema(matchData, schema);
      }

      const {
        homeTeam,
        awayTeam,
        league,
        game,
        date,
      } = matchData;

      const matchId = '';
      const gameId = '';

      /*
        League
      */
      const leagueService = new LeagueService(league, {
        validate: true,
        algoCheck: true,
      });
      await leagueService.init();

      const {
        unique: leagueUnique,
        id: leagueId,
      } = await leagueService.similarityCheck();

      /*
        Team
      */

      const homeTeamService = new TeamService(homeTeam, {
        validate: true,
        algoCheck: true,
      });
      await homeTeamService.init();

      const {
        unique: homeTeamUnique,
        id: homeTeamId,
      } = await homeTeamService.similarityCheck();

      const awayTeamService = new TeamService(awayTeam, {
        validate: true,
        algoCheck: true,
      });
      await awayTeamService.init();

      const {
        unique: awayTeamUnique,
        id: awayTeamId,
      } = await homeTeamService.similarityCheck();

      console.log(`leagueunique: ${leagueUnique}`)
      console.log(`hometeamunique: ${homeTeamUnique}`)
      console.log(`awayteamunique: ${awayTeamUnique}`)


      //return channel.ack(message);
    } catch (error) {
      console.log(error)
      return channel.nack(message);
    }
  });
}

main();
