import {
  Model,
} from 'mongorito';

class Match extends Model {
  static collection() {
    return 'matches';
  }
}

class MatchService {
  constructor(match, opts = {}) {
    this.opts = opts;
    this.match = match;
    this.matches = null;
  }

  static get model() {
    return Match;
  }

  async init() {
    this.matches = await Match.find();
  }

  async save() {
    const match = this.match;

    await new Match(match).save();
  }
}

export default MatchService;
