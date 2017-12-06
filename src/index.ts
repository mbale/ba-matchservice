import * as dotenv from 'dotenv';
import apiGateway from './gateway/api';
import { Container } from 'typedi';
import { Queues, TaskService } from './service/task';
import 'reflect-metadata';

dotenv.config();

const HTTP_PORT = Number.parseInt(process.env.MATCH_SERVICE_API_PORT, 10);

async function main() {
  /*
    Boostrap API
  */
  const api = await apiGateway(HTTP_PORT);

  /*
    Boostrap Tasks
  */

  const taskService = Container.get<TaskService>(TaskService);

  // define handlers for tasks

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
