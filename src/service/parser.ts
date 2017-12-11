import { MatchSource } from 'ba-common';
import { inject, injectable } from 'inversify';
import { LoggerInstance } from 'winston';
import PinnacleHTTPService from './pinnacle';
import { Connection } from 'typeorm/connection/Connection';
import TeamHTTPService from './team';

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
    @inject(TeamHTTPService) private teamHTTPService: TeamHTTPService,
    @inject('logger') private logger: LoggerInstance) {}

  async run(rawMatch: RawMatch) {
    //
    this.logger.info('hi');
  }
}

export default MatchParserService;
