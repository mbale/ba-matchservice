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
  constructor(match) {
    this.match = match;
  }

  static get model() {
    return Match;
  }

  static get schema() {
    return schema;
  }

  async save() {
    const match = this.match;

    const {
      id,
    } = await new Match(match).save();

    return id;
  }
}

export default MatchService;
