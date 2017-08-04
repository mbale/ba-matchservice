import {
  Model,
  ObjectId,
} from 'mongorito';
import Joi from 'joi';
import Utils from './utils.js';

const schema = Joi.string().required();

class Team extends Model {
  static collection() {
    return 'teams';
  }
}

class TeamService {
  constructor(team, opts = {}) {
    this.team = team;
    this.teams = null;

    const {
      validate = true,
    } = opts;

    // check if we need to validate passed league data
    if (validate) {
      Utils.validateSchema(team, schema);
    }
  }

  static get model() {
    return Team;
  }

  static get schema() {
    return schema;
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
      return this.state;
    }

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

        if (diceValue >= 0.3) {
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
      return this.state;
    }

    const isMatchByStrict = relatedTeams.find(relatedTeam => relatedTeam.type === 'strict');

    if (isMatchByStrict) {
      const {
        data: {
          id,
        },
      } = isMatchByStrict;

      this.setState(false, id);
      return this.state;
    }

    const sortBySimiliarity = relatedTeams.sort((a, b) => (a.data.similarity - b.data.similarity));

    // get higher similar team
    const {
      data: {
        id,
      },
    } = sortBySimiliarity[sortBySimiliarity.length - 1];

    this.setState(false, id);
    return this.state;
  }
}

export default TeamService;
