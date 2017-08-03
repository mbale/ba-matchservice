import {
  Model,
  ObjectId,
} from 'mongorito';
import Joi from 'joi';
import Utils from './utils.js';

const schema = Joi.string().required();

class Game extends Model {
  static collection() {
    return 'games';
  }
}

class GameService {
  constructor(game, opts = {}) {
    this.game = game;
    this.games = null;

    const {
      validate = true,
    } = opts;

    // check if we need to validate passed game data
    if (validate) {
      Utils.validateSchema(game, schema);
    }
  }

  static get model() {
    return Game;
  }

  static get schema() {
    return schema;
  }

  async init() {
    this.games = await Game.find();
  }

  async save() {
    const name = this.game;

    await new Game({
      name,
    }).save();
  }

  setState(unique = true, id = false) {
    this.state = {
      unique,
      id,
    };
  }

  async similarityCheck(opts = {}) {
    const games = this.games;
    const gamenameToCheck = this.game;
    const gamenameLowercase = gamenameToCheck.toLowerCase();
    const {
      algoCheck = true,
    } = opts;

    if (games.length === 0) {
      this.setState();
      return this.state;
    }

    const relatedGames = [];

    // we check similarity with every entity in db
    for (const game of games) { // eslint-disable-line
      const {
        _id: gameIdInDb,
        name: gamenameInDb,
      } = await game.get(); // eslint-disable-line

      const strictlyEquals = gamenameInDb === gamenameLowercase;

      // strictly equal
      if (strictlyEquals) {
        relatedGames.push(Utils.similarityType('strict', gamenameInDb, {
          id: new ObjectId(gameIdInDb),
        }));
      }

      if (algoCheck && !strictlyEquals) {
        const {
          dice: diceValue, // int
          levenshtein: levenshteinValue,
        } = Utils.similarityCalculation(gamenameInDb, gamenameToCheck);

        if (diceValue >= 0.7 && levenshteinValue <= 2) {
          // similar but char differences are between ]0,2] equal by length
          relatedGames.push(Utils.similarityType('algo', gamenameInDb, {
            similarity: diceValue,
            distance: levenshteinValue,
            id: new ObjectId(gameIdInDb),
          }));
        }
      }
    }

    if (relatedGames.length === 0) {
      this.setState();
      return this.state;
    }

    const isMatchByStrict = relatedGames.find(relatedGame => relatedGame.type === 'strict');

    if (isMatchByStrict) {
      const {
        data: {
          id,
        },
      } = isMatchByStrict;

      this.setState(false, id);
      return this.state;
    }

    const sortBySimiliarity = relatedGames.sort((a, b) =>
      (a.data.similarity - b.data.similarity));

    const {
      id,
    } = sortBySimiliarity[sortBySimiliarity.length - 1];

    this.setState(false, id);
    return this.state;
  }
}

export default GameService;
