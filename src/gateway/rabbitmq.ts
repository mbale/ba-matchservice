import * as rabbot from 'rabbot';
import { ObjectId } from 'mongodb';
import MatchEntity from '../entity/match';
import { Container } from 'inversify';
import { ConnectionManager } from 'typeorm';

export function initRabbitMQ(container: Container) {
  rabbot.handle('get-by-ids', async ({ body, reply }) => {
    const matchIds = body.map(id => new ObjectId(id));

    const repository = container
      .get<ConnectionManager>('connectionmanager').get().getMongoRepository(MatchEntity);

    const matches = await repository.findByIds(matchIds);

    return reply({
      matches,
    });
  });

}
