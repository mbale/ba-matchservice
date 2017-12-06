import * as dotenv from 'dotenv';
import apiGateway from './gateway/api';
import { Container, Service, Inject } from 'typedi';
import { Queues, TaskService } from './service/task';
import 'reflect-metadata';
import { PinnacleServiceOpts } from './service/pinnacle';
import MatchParserService from './service/parser';

dotenv.config();

const GET_LEAGUES_URL = process.env.MATCH_SERVICE_PINNACLE_GET_LEAGUES_URL;
const GET_MATCHES_URL = process.env.MATCH_SERVICE_PINNACLE_GET_MATCHES_URL;
const SPORT_ID = Number.parseInt(process.env.MATCH_SERVICE_PINNACLE_SPORT_ID, 10);
const API_KEY = process.env.MATCH_SERVICE_PINNACLE_API_KEY;

const HTTP_PORT = Number.parseInt(process.env.MATCH_SERVICE_API_PORT, 10);

async function main() {
  /*
    Boostrap API
  */
  const api = await apiGateway(HTTP_PORT);

  /*
    Boostrap Tasks
  */

  Container.set('pinnacleservice.options', {
    apiKey: API_KEY,
    sportId : SPORT_ID,
    getMatchesUrl: GET_MATCHES_URL,
    getLeaguesUrl: GET_LEAGUES_URL,
  });
  Container.set('pinnacleservice.last', 'null');

  const taskService = Container.get<TaskService>(TaskService);
  // define handlers for tasks
  taskService.matchFetching();

  const matchParserService = new MatchParserService();

  const mFetchQueue = taskService.queueStore.get(Queues.MatchFetching);

  mFetchQueue.add('asd', {
    text: 'valid',
  });

  console.log(await mFetchQueue.count())

  const mFetchQueueHandler = mFetchQueue
    .process('asd', taskService.matchFetching);

  console.log(await mFetchQueue.count())
}

main();
