import * as dotenv from 'dotenv';
import apiGateway from './gateway/api';
import { Container, Service, Inject } from 'typedi';
import { Queues, TaskService } from './service/task';
import 'reflect-metadata';
import PinnacleService, { PinnacleServiceOpts } from './service/pinnacle';
import MatchParserService from './service/parser';
import { MatchSourceType } from 'ba-common';

dotenv.config();

const GET_LEAGUES_URL = process.env.MATCH_SERVICE_PINNACLE_GET_LEAGUES_URL;
const GET_MATCHES_URL = process.env.MATCH_SERVICE_PINNACLE_GET_MATCHES_URL;
const SPORT_ID = Number.parseInt(process.env.MATCH_SERVICE_PINNACLE_SPORT_ID, 10);
const API_KEY = process.env.MATCH_SERVICE_PINNACLE_API_KEY;

const MONGODB_URL = process.env.MATCH_SERVICE_MONGODB_URL;
const HTTP_PORT = Number.parseInt(process.env.MATCH_SERVICE_API_PORT, 10);

async function main() {
  /*
    APIService
  */

  const api = await apiGateway(HTTP_PORT);

  /*
    TaskService
  */

  Container.set('pinnacleservice.options', {
    apiKey: API_KEY,
    sportId : SPORT_ID,
    getMatchesUrl: GET_MATCHES_URL,
    getLeaguesUrl: GET_LEAGUES_URL,
  });

  // Container.set('mongodb_url', MONGODB_URL);
  const taskService = Container.get<TaskService>(TaskService);
  const queueStore = taskService.queueStore;

  await taskService.setupTaskHandlers();

  taskService.addTask(MatchSourceType.Pinnacle, Queues.MatchFetching, { data: 'data' });

  // taskService.queueStore.get(Queues.MatchFetching).add('data', {
  //   data: 'data',
  // })

  // taskService.addTask(Queues.MatchFetching)

  // await taskService.fetchPinnacleMatches();

  // mFetchQueue.process('hi', taskService.matchFetching);
}

main();
