import Utils from '../utils.js';

class TeamComparator {
  static async findSimilar(teamname, teamCollection, opts = {}) {
    const teamnameLowercase = teamname.toLowerCase();
    const teams = teamCollection;

    let teamEntity = null;

    const {
      algoCheck = false,
    } = opts;

    if (teams.length > 0) {
      const relatedTeams = [];

      // we check similarity with every entity in db
      for (const team of teams) {
        const teamnameInDb = await team.get('name');

        const strictlyEquals = teamnameInDb.toLowerCase() === teamnameLowercase;

        // strictly equal
        if (strictlyEquals) {
          relatedTeams.push(Utils.similarityType('strict', team));
        }

        if (algoCheck && !strictlyEquals) {
          const {
            dice: diceValue, // int
            levenshtein: levenshteinValue,
          } = Utils.similarityCalculation(teamnameInDb, teamname);

          if (diceValue >= 0.6 && levenshteinValue <= 3) {
            // similar with char differences
            relatedTeams.push(Utils.similarityType('algo', team, {
              similarity: diceValue,
              distance: levenshteinValue,
            }));
          }
        }
      }

      if (relatedTeams.length > 0) {
        const isMatchByStrict = relatedTeams.find(relatedTeam => relatedTeam.type === 'strict');

        if (isMatchByStrict) {
          const {
            entity,
          } = isMatchByStrict;

          teamEntity = entity;
        } else {
          const sortBySimiliarity = relatedTeams.sort((a, b) =>
            (a.data.similarity - b.data.similarity));

          const {
            entity,
          } = sortBySimiliarity[sortBySimiliarity.length - 1];

          teamEntity = entity;
        }
      }
    }
    return teamEntity;
  }
}

export default TeamComparator;
