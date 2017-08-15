import {
  ObjectId,
} from 'mongorito';
import Utils from '../utils.js';

class TeamComparator {
  static async findSimilar(team, teamCollection, opts = {}) {
    const teamnameToCheck = team;
    const teams = teamCollection;

    let state = null;

    const teamnameLowercase = teamnameToCheck.toLowerCase();

    const {
      algoCheck = false,
    } = opts;

    if (teams.length === 0) {
      state = Utils.state();
    } else {
      const relatedTeams = [];

      // we check similarity with every entity in db
      for (const team of teams) { // eslint-disable-line
        const {
          _id: teamIdInDb,
          name: teamnameInDb,
        } = await team.get(); // eslint-disable-line

        const strictlyEquals = teamnameInDb.toLowerCase() === teamnameLowercase;

        // strictly equal
        if (strictlyEquals) {
          relatedTeams.push(Utils.similarityType('strict', teamnameInDb, {
            id: new ObjectId(teamIdInDb),
          }));
        }

        if (algoCheck && !strictlyEquals) {
          const {
            dice: diceValue, // int
            levenshtein: levenshteinValue,
          } = Utils.similarityCalculation(teamnameInDb, teamnameToCheck);

          if (diceValue >= 0.6) {
            // similar but char differences are between ]0,2] equal by length
            relatedTeams.push(Utils.similarityType('algo', teamnameInDb, {
              similarity: diceValue,
              distance: levenshteinValue,
              id: new ObjectId(teamIdInDb),
            }));
          }
        }
      }

      if (relatedTeams.length === 0) {
        state = Utils.state();
      } else {
        const isMatchByStrict = relatedTeams.find(relatedTeam => relatedTeam.type === 'strict');

        if (isMatchByStrict) {
          const {
            data: {
              id,
            },
          } = isMatchByStrict;

          state = Utils.state(false, id);
        } else {
          const sortBySimiliarity = relatedTeams.sort((a, b) =>
            (a.data.similarity - b.data.similarity));

          const {
            data: {
              id,
            },
          } = sortBySimiliarity[sortBySimiliarity.length - 1];

          state = Utils.state(false, id);
        }
      }
    }
    return state;
  }
}

export default TeamComparator;
