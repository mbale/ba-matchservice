import PinnacleService from './service/pinnacle';
import matchParser from './parser';
import 'reflect-metadata';
import apiGateway from './gateway/api';
import * as dotenv from 'dotenv';
import { dIConnection } from 'ba-common';

dotenv.config();

const REDIS_URL = process.env.MATCH_SERVICE_REDIS_URL;
const HTTP_PORT = Number.parseInt(process.env.MATCH_SERVICE_API_PORT, 10);

const GET_LEAGUES_URL = process.env.MATCH_SERVICE_PINNACLE_GET_LEAGUES_URL;
const GET_MATCHES_URL = process.env.MATCH_SERVICE_PINNACLE_GET_MATCHES_URL;
const SPORT_ID = Number.parseInt(process.env.MATCH_SERVICE_PINNACLE_SPORT_ID, 10);
const API_KEY = process.env.MATCH_SERVICE_PINNACLE_API_KEY;

async function main() {
  const api = await apiGateway(HTTP_PORT);

  const pinnacleService = new PinnacleService({
    apiKey: API_KEY,
    sportId : SPORT_ID,
    getMatchesUrl: GET_MATCHES_URL,
    getLeaguesUrl: GET_LEAGUES_URL,
  });

  // await pinnacleService.fetchMatches();
}

main();
