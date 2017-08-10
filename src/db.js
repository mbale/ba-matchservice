import dotenv from 'dotenv';
import {
  Database,
} from 'mongorito';
import timestamps from 'mongorito-timestamps';
import Match from './models/match.js';
import League from './models/league.js';
import Team from './models/team.js';
import Game from './models/game.js';

dotenv.config();

async function initDbConnection() {
  const db = new Database(process.env.MONGODB_URI);
  // connect
  await db.connect();

  // plugin
  db.use(timestamps());
  // registering model
  db.register(Game);
  db.register(Match);
  db.register(Team);
  db.register(League);

  console.log('reg')

  return db;
}

export default initDbConnection;
