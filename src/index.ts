import 'reflect-metadata';
import TeamHTTPService from './service/team';
import * as dotenv from 'dotenv';
import apiGateway from './gateway/api';
// import { Container, Service, Inject } from 'typedi';
import PinnacleHTTPService, { PinnacleHTTPServiceOpts } from './service/pinnacle';
import MatchParserService from './service/parser';
import { MatchSourceType } from 'ba-common';
import initContainer from './container';

dotenv.config();

const HTTP_PORT = Number.parseInt(process.env.MATCH_SERVICE_API_PORT, 10);

async function main() {
  const container = await initContainer();

  /*
    APIService
  */

  const api = await apiGateway(HTTP_PORT);

  // await taskService.setupTaskHandlers();

  // taskService.addTask(MatchSourceType.Pinnacle, Queues.MatchFetching, { data: 'data' }, {});

  // const t = Container.get<TeamHTTPService>(TeamHTTPService);

  // console.log(t);

  // taskService.queueStore.get(Queues.MatchFetching).add('data', {
  //   data: 'data',
  // })

  // taskService.addTask(Queues.MatchFetching)

  // await taskService.fetchPinnacleMatches();

  // mFetchQueue.process('hi', taskService.matchFetching);
}

main();
