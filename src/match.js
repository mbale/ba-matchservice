import {
  Model,
} from 'mongorito';
import Joi from 'joi';

const schema = Joi.string().required();

class Match extends Model {
  static collection() {
    return 'matches';
  }
}

class MatchService {
  static get model() {
    return Match;
  }

  static get schema() {
    return schema;
  }

  async save() {
    const {
      leagueId,
      gameId,
      homeTeamId,
      awayTeamId,
    } = this.match;

    await new Match({
      leagueId,
      gameId,
      homeTeamId,
      awayTeamId,
    }).save();
  }
}

export default MatchService;
