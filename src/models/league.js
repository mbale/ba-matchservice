import {
  Model,
  ObjectId,
} from 'mongorito';
import Utils from '../utils.js';

class League extends Model {
  static collection() {
    return 'leagues';
  }
}

class LeagueService {
  constructor(league) {
    this.league = league.trim();
    this.leagues = null;
  }

  static get model() {
    return League;
  }

  async init() {
    this.leagues = await League.find();
  }

  async save() {
    const name = this.league;

    const {
      id,
    } = await new League({
      name,
    }).save();

    return id;
  }

  setState(unique = true, id = false) {
    this.state = {
      unique,
      id,
    };
  }

  async similarityCheck(opts = {}) {
    await this.init();
    const leagues = this.leagues;
    const leaguenameToCheck = this.league;
    const leaguenameLowercase = leaguenameToCheck.toLowerCase();
    const {
      algoCheck = true,
    } = opts;

    if (leagues.length === 0) {
      this.setState();
    } else {
      const relatedLeagues = [];

      // we check similarity with every entity in db
      for (const league of leagues) { // eslint-disable-line
        const {
          _id: leagueIdInDb,
          name: leaguenameInDb,
        } = await league.get(); // eslint-disable-line

        const strictlyEquals = leaguenameInDb.toLowerCase() === leaguenameLowercase;

        // strictly equal
        if (strictlyEquals) {
          relatedLeagues.push(Utils.similarityType('strict', leaguenameInDb, {
            id: new ObjectId(leagueIdInDb),
          }));
        }

        if (algoCheck && !strictlyEquals) {
          const {
            dice: diceValue, // int
            levenshtein: levenshteinValue,
          } = Utils.similarityCalculation(leaguenameInDb, leaguenameToCheck);

          if (diceValue >= 0.7 && levenshteinValue <= 3) {
            // similar but char differences are between ]0,2] equal by length
            relatedLeagues.push(Utils.similarityType('algo', leaguenameInDb, {
              similarity: diceValue,
              distance: levenshteinValue,
              id: new ObjectId(leagueIdInDb),
            }));
          }
        }
      }

      if (relatedLeagues.length === 0) {
        this.setState();
      } else {
        const isMatchByStrict = relatedLeagues.find(relatedLeague => relatedLeague.type === 'strict');

        if (isMatchByStrict) {
          const {
            data: {
              id,
            },
          } = isMatchByStrict;

          this.setState(false, id);
        } else {
          const sortBySimiliarity = relatedLeagues.sort((a, b) =>
          (a.data.similarity - b.data.similarity));

          const {
            id,
          } = sortBySimiliarity[sortBySimiliarity.length - 1];
          this.setState(false, id);
        }
      }
    }
    return this.state;
  }
}

export default League;
