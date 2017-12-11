import TeamHTTPService from './team';
import { MatchSource } from 'ba-common';
import { inject, injectable } from 'inversify';
import { LoggerInstance } from 'winston';
import PinnacleHTTPService from './pinnacle';

export interface RawMatch {
  homeTeam : string;
  awayTeam : string;
  game : string;
  league : string;
  _source : MatchSource;
  date : Date;
}

export enum MatchParsingResult {
  Fresh = 'new', Duplicate = 'duplicate', Invalid = 'invalid',
}

@injectable()
class MatchParserService {
  constructor(
    @inject(TeamHTTPService) private teamHTTPService: TeamHTTPService,
    @inject('logger') private logger: LoggerInstance) {}

  async run(rawMatch: RawMatch): Promise<MatchParsingResult> {
    const homeTeamId = await this.teamHTTPService.compare({
      'team-name': rawMatch.homeTeam,
      'game-name': rawMatch.game,
    });

    const awayTeamId = await this.teamHTTPService.compare({
      'team-name': rawMatch.awayTeam,
      'game-name': rawMatch.game,
    });

    // this.logger.info('Comparing match with data');
    
    return MatchParsingResult.Fresh;
  }
}

export default MatchParserService;
