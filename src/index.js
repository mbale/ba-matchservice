
import dotenv from 'dotenv';
import amqplib from 'amqplib';
import {
  Database,
} from 'mongorito';
import timestamps from 'mongorito-timestamps';
// import _ from 'lodash';
// import {
//   similarity,
// } from 'talisman/metrics/distance/dice';
import Match from '~/model.js';
// import {
//   KeywordDuplicationError,
// } from '~/errors.js';

/*
  Init
 */

dotenv.config();

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

  await channel.prefetch(1);
  return channel;
}

/*
  Service
 */

async function main() {
  await initDbConnection();
  const channel = await initRabbitMQConnection();

  async function propagateMatches(message) {
    try {
      let {
        content,
      } = message;
      content = JSON.parse(content.toString());

      const {
        properties: {
          correlationId,
          replyTo,
        },
      } = message;

      const {
        homeTeam,
        awayTeam,
        status,
        date,
      } = content;

      const match = await new Match({
        homeTeam,
        awayTeam,
        status,
        date,
        correlationId,
      }).save();

      channel.ack(message);
      await channel.sendToQueue(replyTo, new Buffer('done'), {
        correlationId,
      });
    } catch (error) {

    }
  }

  channel.consume('matches', propagateMatches);
}

main();
