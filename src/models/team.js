import {
  Model,
  ObjectId,
} from 'mongorito';
import Utils from '../utils.js';

class Team extends Model {
  static collection() {
    return 'teams';
  }
}

class TeamService {
  constructor(team) {
    this.team = team.trim();
    this.teams = null;
  }

  static get model() {
    return Team;
  }

  async init() {
    this.teams = await Team.find();
  }

  async save() {
    const name = this.team;

    const {
      id,
    } = await new Team({
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
    const teams = this.teams;
    const teamnameToCheck = this.team;
    const teamnameLowercase = teamnameToCheck.toLowerCase();
    const {
      algoCheck = true,
    } = opts;

    if (teams.length === 0) {
      this.setState();
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

          if (diceValue >= 0.7 && levenshteinValue <= 2) {
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
        this.setState();
      } else {
        const isMatchByStrict = relatedTeams.find(relatedTeam => relatedTeam.type === 'strict');

        if (isMatchByStrict) {
          const {
            data: {
              id,
            },
          } = isMatchByStrict;

          this.setState(false, id);
        } else {
          const sortBySimiliarity = relatedTeams.sort((a, b) => (
            a.data.similarity - b.data.similarity));

          // get higher similar team
          const {
            data: {
              id,
            },
          } = sortBySimiliarity[sortBySimiliarity.length - 1];

          this.setState(false, id);
        }
      }
      console.log(teamnameLowercase)
      console.log(relatedTeams)
    }
    return this.state;
  }
}

export default Team;
