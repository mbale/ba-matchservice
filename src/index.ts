import 'reflect-metadata';
import initContainer from './container';


async function main() {
  const container = await initContainer();

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
