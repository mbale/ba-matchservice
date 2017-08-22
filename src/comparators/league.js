import Utils from '../utils.js';

class LeagueComparator {
  static async findSimilar(leaguename, leagueCollection, opts = {}) {
    const leaguenameLowercase = leaguename.toLowerCase();
    const leagues = leagueCollection;

    let leagueEntity = null;

    const {
      algoCheck = false,
    } = opts;

    if (leagues.length > 0) {
      const relatedLeagues = [];

      // we check similarity with every entity in db
      for (const league of leagues) {
        const leaguenameInDb = await league.get('name');

        const strictlyEquals = leaguenameInDb.toLowerCase() === leaguenameLowercase;

        // strictly equal
        if (strictlyEquals) {
          relatedLeagues.push(Utils.similarityType('strict', league));
        }

        if (algoCheck && !strictlyEquals) {
          const {
            dice: diceValue, // int
            levenshtein: levenshteinValue,
          } = Utils.similarityCalculation(leaguenameInDb, leaguename);

          if (diceValue >= 0.7 && levenshteinValue <= 3) {
            // similar but char differences are between ]0,2] equal by length
            relatedLeagues.push(Utils.similarityType('algo', league, {
              similarity: diceValue,
              distance: levenshteinValue,
            }));
          }
        }
      }

      if (relatedLeagues.length > 0) {
        const isMatchByStrict = relatedLeagues.find(relatedLeague => relatedLeague.type === 'strict');

        // strict
        if (isMatchByStrict) {
          const {
            entity,
          } = isMatchByStrict;

          leagueEntity = entity;
        } else {
          const sortBySimiliarity = relatedLeagues.sort((a, b) =>
          (a.data.similarity - b.data.similarity));

          const {
            entity,
          } = sortBySimiliarity[sortBySimiliarity.length - 1];

          leagueEntity = entity;
        }
      }
    }
    return leagueEntity;
  }
}

export default LeagueComparator;
