import { MatchSource, TeamHTTPService } from 'ba-common';
import { inject, injectable } from 'inversify';
import { LoggerInstance } from 'winston';
import PinnacleHTTPService from './pinnacle';
import { ConnectionManager } from 'typeorm/connection/ConnectionManager';
import MatchEntity from '../entity/match';
import LeagueEntity from '../entity/league';
import { ObjectId } from 'bson';
import { ObjectID } from 'typeorm';

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
    @inject('logger') private logger: LoggerInstance,
    @inject('connectionmanager') private connectionManager: ConnectionManager)
    {}

  async run(rawMatch: RawMatch): Promise<MatchParsingResult> {
    try {
      await this.teamHTTPService.ping();

      const matchRepository = this.connectionManager.get().getMongoRepository(MatchEntity);
      const leagueRepository = this.connectionManager.get().getMongoRepository(LeagueEntity);

      let {
        gameId: homeTeamGameId,
        teamId: homeTeamId,
      } = await this.teamHTTPService.compare({
        'team-name': rawMatch.homeTeam,
        'game-name': rawMatch.game,
      });

      let {
        gameId: awayTeamGameId,
        teamId: awayTeamId,
      } = await this.teamHTTPService.compare({
        'team-name': rawMatch.awayTeam,
        'game-name': rawMatch.game,
      });

      homeTeamId = new ObjectId(homeTeamId);
      homeTeamGameId = new ObjectId(homeTeamGameId);
      awayTeamId = new ObjectId(awayTeamId);
      awayTeamGameId = new ObjectId(awayTeamGameId);

      const gameId = new ObjectId(awayTeamGameId);
      const date = new Date(rawMatch.date);

      const duplication = await matchRepository.findOne({
        date,
        homeTeamId,
        awayTeamId,
      });

      if (duplication) {
        return MatchParsingResult.Duplicate;
      }

      let league = await leagueRepository.findOne({
        name: rawMatch.league,
      });

      if (!league) {
        league = new LeagueEntity();
        league.name = rawMatch.league;

        league = await leagueRepository.save(league);
      }

      let match = new MatchEntity();

      match.awayTeamId = awayTeamId;
      match.homeTeamId = homeTeamId;
      match.leagueId = league._id;
      match.gameId = gameId;
      match.date = date;
      match._source = rawMatch._source;

      // pinnacle sometimes has matches with the same team...
      if (!homeTeamId.equals(awayTeamId)) {
        match = await matchRepository.save(match);
      }

      return MatchParsingResult.Fresh;
    } catch (error) {
      throw error;
    }
  }
}

export default MatchParserService;
