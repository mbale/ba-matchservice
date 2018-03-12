import * as rabbot from 'rabbot';
import { ObjectId } from 'mongodb';
import MatchEntity from '../entity/match';
import { Container } from 'inversify';
import { ConnectionManager } from 'typeorm';
import LeagueEntity from '../entity/league';

export function initRabbitMQ(container: Container) {
  rabbot.handle('get-matches-by-ids', async ({ body, reply }) => {
    const matchIds = body.map(id => new ObjectId(id));

    const repository = container
      .get<ConnectionManager>('connectionmanager').get().getMongoRepository(MatchEntity);

    const matches = await repository.findByIds(matchIds);

    return reply({
      matches,
    });
  });

  rabbot.handle('get-leagues-by-ids', async ({ body, reply }) => {
    const leagueIds = body.map(id => new ObjectId(id));

    const repository = container
      .get<ConnectionManager>('connectionmanager').get().getMongoRepository(LeagueEntity);

    const leagues = await repository.findByIds(leagueIds);

    return reply({
      leagues,
    });
  });

}
