import dotenv from 'dotenv';
import amqplib from 'amqplib';
import {
  Database,
  ObjectId,
} from 'mongorito';
import timestamps from 'mongorito-timestamps';
import uuidv1 from 'uuid/v1';
import Match from '~/model.js';
import Errors from '~/errors.js';

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
}

async function initRabbitMQConnection() {
  const connection = await amqplib.connect(process.env.RABBITMQ_URI);
  const channel = await connection.createChannel();
  /*
    Creating queues that service depends on
   */
  await channel.assertQueue(QueueTypes.FIND_OR_CREATE_MATCH);
  await channel.assertQueue(QueueTypes.UPDATE_LEAGUE_RELATION);

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
      console.log('-= Incoming match =-');
      /*
        Parse data
       */
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

      /*
        Validation TODO. REGEXP
       */
      console.log('-= Validation =-');
      console.log('a.) schema');
      // done fail
      console.log('b.) duplication integrity');
      // done fail

      /*
        Data conversion
       */
      date = new Date(date);

      /*
        Generate correlation ids for each data
       */
      const leagueCorrelationId = uuidv1();
      const homeTeamCorrelationId = uuidv1();
      const awayTeamCorrelationId = uuidv1();
      const gameCorrelationId = uuidv1();

      /*
        Save match
       */
      // we store correlationids for each resource (team, league, game) to connect them later
      const {
        id: matchId,
      } = await new Match({
        homeTeamId: homeTeamCorrelationId,
        awayTeamId: awayTeamCorrelationId,
        leagueId: leagueCorrelationId,
        gameId: gameCorrelationId,
        score: '',
        date,
      }).save();

      console.log('-= Saving entity =-');
      console.log(`entity_id: ${matchId}`);

      /*
        Messaging
        Requests to another services
       */
      const leagueMessage = new Buffer(JSON.stringify({
        league,
      }));

      await channel.sendToQueue(QueueTypes.FIND_OR_CREATE_LEAGUE, leagueMessage, {
        replyTo: QueueTypes.UPDATE_LEAGUE_RELATION,
        correlationId: leagueCorrelationId,
      });
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
