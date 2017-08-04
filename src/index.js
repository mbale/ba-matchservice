import dotenv from 'dotenv';
import amqplib from 'amqplib';
import {
  Database,
} from 'mongorito';
import timestamps from 'mongorito-timestamps';
import Raven from 'raven';
import Joi from 'joi';
import Utils from './utils.js';
import MatchService from './match.js';
import LeagueService from './league.js';
import TeamService from './team.js';
import GameService from './game.js';

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
  db.register(GameService.model);
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
      } = matchData;

      let {
        date,
      } = matchData;

      date = new Date(date);

      /*
        League
      */
      const leagueService = new LeagueService(league);

      const {
        unique: leagueUnique,
        id: leagueId,
      } = await leagueService.similarityCheck({
        algoCheck: false,
      });

      /*
        Team
      */

      const homeTeamService = new TeamService(homeTeam);

      const {
        unique: homeTeamUnique,
        id: homeTeamId,
      } = await homeTeamService.similarityCheck({
        algoCheck: false,
      });

      const awayTeamService = new TeamService(awayTeam);
      await awayTeamService.init();

      const {
        unique: awayTeamUnique,
        id: awayTeamId,
      } = await homeTeamService.similarityCheck({
        algoCheck: false,
      });

      /*
        Game
      */

      const gameService = new GameService(game);

      const {
        unique: gameUnique,
        id: gameId,
      } = await gameService.similarityCheck({
        algoCheck: false,
      });

      /*
        Match
      */

      const match = {
        date,
      };

      if (!leagueUnique) {
        match.leagueId = leagueId;
      } else {
        match.leagueId = await leagueService.save();
      }

      if (!homeTeamUnique) {
        match.homeTeamId = homeTeamId;
      } else {
        match.homeTeamId = await homeTeamService.save();
      }

      if (!awayTeamUnique) {
        match.awayTeamId = awayTeamId;
      } else {
        match.awayTeamId = await awayTeamService.save();
      }

      if (!gameUnique) {
        match.gameId = gameId;
      } else {
        match.gameId = await gameService.save();
      }

      const matchService = new MatchService(match);

      // check if we have the same match in db

      const similarMatch = await MatchService.model.findOne({
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        date,
      });

      if (similarMatch) {
        console.log(`found similar match: ${await similarMatch.get('_id')}`);
      } else {
        const matchId = await matchService.save();
        console.log(`saved new match: ${matchId}`);
      }

      console.log('gameunique:' + gameUnique)
      console.log(`leagueunique: ${leagueUnique}`)
      console.log(`hometeamunique: ${homeTeamUnique}`)
      console.log(`awayteamunique: ${awayTeamUnique}`)

      return channel.ack(message);
    } catch (error) {
      console.log(error);
      Raven.captureException(error);
      return channel.nack(message);
    }
  });
}

main();
