import {
  ObjectId,
} from 'mongorito';
import Utils from '../utils.js';

class LeagueComparator {
  static async findSimilar(league, leagueCollection, opts = {}) {
    const leagues = leagueCollection;
    const leaguenameToCheck = league;

    let state = null;

    const leaguenameLowercase = leaguenameToCheck.toLowerCase();

    const {
      algoCheck = false,
    } = opts;

    if (leagues.length === 0) {
      state = Utils.state();
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
        state = Utils.state();
      } else {
        const isMatchByStrict = relatedLeagues.find(relatedLeague => relatedLeague.type === 'strict');

        if (isMatchByStrict) {
          const {
            data: {
              id,
            },
          } = isMatchByStrict;

          state = Utils.state(false, id);
        } else {
          const sortBySimiliarity = relatedLeagues.sort((a, b) =>
          (a.data.similarity - b.data.similarity));

          const {
            id,
          } = sortBySimiliarity[sortBySimiliarity.length - 1];

          state = Utils.state(false, id);
        }
      }
    }
    return state;
  }
}

export default LeagueComparator;
