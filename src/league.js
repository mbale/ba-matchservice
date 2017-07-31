import {
  Model,
  ObjectId,
} from 'mongorito';
import Joi from 'joi';
import Utils from '~/utils.js';

const schema = Joi.string().required();

class League extends Model {
  static collection() {
    return 'leagues';
  }
}

class LeagueService {
  constructor(league, opts = {}) {
    this.opts = opts;
    this.league = league;
    this.leagues = null;
    this.state = {
      unique: null,
      data: null,
    };
  }

  static get model() {
    return League;
  }

  static get schema() {
    return schema;
  }

  async init() {
    this.leagues = await League.find();
  }

  async save() {
    const name = this.league;

    await new League({
      name,
    }).save();
  }

  setState(unique = false, data = {}) {
    this.state.unique = unique;
    this.state.data = data;
  }

  async similarityCheck() {
    const leagues = this.leagues;
    const leaguenameToCheck = this.league;
    const state = this.state;
    const {
      algoCheck = true,
    } = this.opts;

    if (leagues.length === 0) {
      this.setState(true);
      return state;
    }

    const relatedLeagues = [];

    // we check similarity with every entity in db
    for (const league of leagues) { // eslint-disable-line
      const {
        _id: leagueIdInDb,
        name: leaguenameInDb,
      } = await league.get(); // eslint-disable-line

      const {
        dice: diceValue, // int
        levenshtein: levenshteinValue,
      } = Utils.similarityCalculation(leaguenameInDb, leaguenameToCheck);

      const strictlyEquals = leaguenameInDb === leaguenameToCheck;

      // strictly equal
      if (strictlyEquals) {
        relatedLeagues.push(Utils.similarityType('strict', leaguenameInDb, {
          id: new ObjectId(leagueIdInDb),
        }));
      }

      if (algoCheck && !strictlyEquals &&
        diceValue >= 0.7 && levenshteinValue <= 2) {
        // similar but char differences are between ]0,2] equal by length
        relatedLeagues.push(Utils.similarityType('algo', leaguenameInDb, {
          similarity: diceValue,
          distance: levenshteinValue,
          id: new ObjectId(leagueIdInDb),
        }));
      }
    }

    if (relatedLeagues.length === 0) {
      this.setState(true);
      return state;
    }

    const isMatchByStrict = relatedLeagues.find(relatedLeague => relatedLeague.type === 'strict');

    if (isMatchByStrict) {
      const {
        data: {
          id,
        },
      } = isMatchByStrict;

      this.setState(false, {
        id,
      });
      return state;
    }

    const sortBySimiliarity = relatedLeagues.sort((a, b) => (a.similarity - b.similarity));

    const {
      id,
    } = sortBySimiliarity[sortBySimiliarity.length - 1];

    this.setState(false, {
      id,
    });
    return state;
  }
}

export default LeagueService;
