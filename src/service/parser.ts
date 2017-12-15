import { MatchSource, TeamHTTPService } from 'ba-common';
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
    try {
      this.logger.info(`Testing ${TeamHTTPService.name}'s availability`);
      await this.teamHTTPService.ping();
      this.logger.info(`It's OK`);

      this.logger.info(`Requesting ${TeamHTTPService.name} to compare`);
      const {
        gameId: homeTeamGameId,
        teamId: homeTeamId,
      } = await this.teamHTTPService.compare({
        'team-name': rawMatch.homeTeam,
        'game-name': rawMatch.game,
      });

      const {
        gameId: awayTeamGameId,
        teamId: awayTeamId,
      } = await this.teamHTTPService.compare({
        'team-name': rawMatch.awayTeam,
        'game-name': rawMatch.game,
      });

      this.logger.info(`Got result:
        homeTeamId: ${homeTeamId}
        homeTeamGameId: ${homeTeamGameId}
        awayTeamId: ${awayTeamId}
        awayTeamGameId: ${awayTeamGameId}
      `);

      return MatchParsingResult.Fresh; 
    } catch (error) {
      throw error;
    }
  }
}

export default MatchParserService;
