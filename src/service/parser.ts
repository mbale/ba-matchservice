import { MatchSource } from 'ba-common';
import { inject, injectable } from 'inversify';
import { LoggerInstance } from 'winston';
import PinnacleHTTPService from './pinnacle';
import { Connection } from 'typeorm/connection/Connection';

export interface RawMatch {
  homeTeam : string;
  awayTeam : string;
  game : string;
  league : string;
  _source : MatchSource;
  date : Date;
}

@injectable()
class MatchParserService {
  constructor(
    @inject(PinnacleHTTPService) private pinnacleHTTPService: PinnacleHTTPService,
    @inject('logger') private logger: LoggerInstance) {}

  run() {
    this.logger.info('hi');
  }
}

export default MatchParserService;
