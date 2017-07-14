import dotenv from 'dotenv';
import amqplib from 'amqplib';
import {
  Database,
  ObjectId,
} from 'mongorito';
import timestamps from 'mongorito-timestamps';
import {
  LeagueService,
  League,
} from '~/league.js';
import {
  TeamService,
  Team,
} from '~/team.js';
import uuidv1 from 'uuid/v1';
import Match from '~/model.js';
import Errors from '~/errors.js';

const leagueService = LeagueService;
const teamService = TeamService;

/*
  Errors
 */
const {
  UnknownCorrelationIdError,
} = Errors;

/*
  Queue declarations
 */
const QueueTypes = {
  UPDATE_LEAGUE_RELATION: 'matches.updateLeagueRelation',
  FIND_OR_CREATE_MATCH: 'matches',
  FIND_OR_CREATE_LEAGUE: 'leagues',
};

/*
  Init
 */
dotenv.config();

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
  db.register(Match);
  db.register(League);
  db.register(Team);
}

async function initRabbitMQConnection() {
  const connection = await amqplib.connect(process.env.RABBITMQ_URI);
  const channel = await connection.createChannel();
  /*
    Creating queues that service depends on
   */
  await channel.assertQueue(QueueTypes.FIND_OR_CREATE_MATCH);
  // await channel.assertQueue(QueueTypes.UPDATE_LEAGUE_RELATION);

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
    Handles match saving with requests to another services
   */
  async function findOrCreateMatch(message) {
    try {
      /*
        Data conversion
       */
      console.log('-= Incoming match =-');
      let {
        content,
      } = message;
      content = JSON.parse(content.toString());

      let {
        homeTeam,
        awayTeam,
        league,
        date,
        game,
      } = content;

      date = new Date(date);

      /*
        Validation
        TODO. REGEXP
       */
      console.log('-= Validation =-');
      console.log('a.) schema');
      // done fail
      console.log('b.) duplication integrity');
      // done fail

      /*
        League service
       */

      console.log(content)
      const {
        leagueId, // isunique?, leagueid,
        isLeagueUnique,
      } = await leagueService(league);

      /*
        Team service
       */

      // const {
      //   teamId: homeTeamId,
      //   isTeamUnique: isHomeTeamUnique,
      // } = await teamService(homeTeam);

      /*
        Save match
       */
      const {
        id: matchId,
      } = await new Match({
        homeTeamId: 0,
        awayTeamId: 0,
        leagueId,
        gameId: game,
        score: '',
        date,
      }).save();

      // console.log('-= Saving entity =-');
      // console.log(`entity_id: ${matchId}`);

      /*
        Messaging
        Requests to another services
       */
      // const leagueMessage = new Buffer(JSON.stringify({
      //   league,
      // }));

      // await channel.sendToQueue(QueueTypes.FIND_OR_CREATE_LEAGUE, leagueMessage, {
      //   replyTo: QueueTypes.UPDATE_LEAGUE_RELATION,
      //   correlationId: leagueCorrelationId,
      // });
      return channel.ack(message); // we disable this so we can debug freely
    } catch (error) {
      console.log(error)
    }
  }

  /*
    Update stored match league referency by correlationId
   */
  async function updateLeagueRelation(message) {
    /*
      Parsing data
      leaguecorrelationid: we know which match
      leagueid: leagueid of match to relate
     */
    try {
      const {
        content,
        properties: {
          correlationId: leagueCorrelationId,
        },
      } = message;

      let {
        leagueId,
      } = JSON.parse(content.toString());
      leagueId = new ObjectId(leagueId);

      /*
        Logging
       */
      console.log('-= Updating match relation with league =-');
      console.log(`correlation_id: ${leagueCorrelationId}`);
      console.log(`league_id: ${leagueId}`);

      // find match based on correlationid when we saved match
      const match = await Match.findOne({
        leagueId: leagueCorrelationId,
      });

      /*
        Assigning leagueid to correct match
       */
      if (match) {
        const {
          id,
        } = await match.get();
        console.log(`match_id: ${id}`);

        // TODO: commit phase change
        // saving leagueid for match
        match.set('leagueId', leagueId);
        await match.save();

        // everything went well
        channel.ack(message);
      } else {
        throw new UnknownCorrelationIdError(leagueCorrelationId, 'league');
      }
    } catch (error) {
      if (error instanceof UnknownCorrelationIdError) {
        console.log(error.message);
        console.log(error.correlationId);
        console.log(error.type);
        // channel.nack(message); due to debug we disable nacking
      }
    }
  }

  /*
    Consumers
  */
  channel.consume(QueueTypes.FIND_OR_CREATE_MATCH, findOrCreateMatch);
  channel.consume(QueueTypes.UPDATE_LEAGUE_RELATION, updateLeagueRelation);
}

main();
