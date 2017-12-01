import MatchController from './controller';
import * as express from 'express';
import { useExpressServer, useContainer } from 'routing-controllers';
import { dIConnection } from 'ba-common';
import { Container } from 'typedi';
import { useContainer as useContainerDB } from 'typeorm';

async function apiGateway(port: number): Promise<express.Application> {
  
  const app = express();
  useExpressServer(app, {
    // cors: true,
    validation: true,
    controllers: [MatchController],
  });

  useContainer(Container);
  useContainerDB(Container);
  
  app.listen(port, () => {
    console.log(`Listening on ${port}`);
  });

  return app;
}

export default apiGateway;