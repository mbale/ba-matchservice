import dotenv from 'dotenv';
import {
  Database,
} from 'mongorito';
import timestamps from 'mongorito-timestamps';
import Transaction from './models/transaction.js';
import Source from './models/source.js';
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
  db.use(timestamps({
    createdAt: '_createdAt',
    updatedAt: '_updatedAt',
  }));
  // registering model
  db.register(Transaction);
  db.register(Source);
  db.register(Game);
  db.register(Match);
  db.register(Team);
  db.register(League);

  return db;
}

export default initDbConnection;
