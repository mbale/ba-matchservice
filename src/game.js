import {
  Model,
  ObjectId,
} from 'mongorito';
import Utils from './utils.js';


class Game extends Model {
  static collection() {
    return 'games';
  }
}

class GameService {
  constructor(game) {
    this.game = game.trim();
    this.games = null;
  }

  static get model() {
    return Game;
  }

  async init() {
    this.games = await Game.find();
  }

  async save() {
    const name = this.game;

    const {
      id,
    } = await new Game({
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
    const games = this.games;
    const gamenameToCheck = this.game;
    const gamenameLowercase = gamenameToCheck.toLowerCase();
    const {
      algoCheck = true,
    } = opts;

    if (games.length === 0) {
      this.setState();
    } else {
      const relatedGames = [];

      // we check similarity with every entity in db
      for (const game of games) { // eslint-disable-line
        const {
          _id: gameIdInDb,
          name: gamenameInDb,
        } = await game.get(); // eslint-disable-line

        const strictlyEquals = gamenameInDb.toLowerCase() === gamenameLowercase;

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

          if (diceValue >= 0.7 && levenshteinValue <= 3) {
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
      } else {
        const isMatchByStrict = relatedGames.find(relatedGame => relatedGame.type === 'strict');

        // if we found strictly equivalent
        if (isMatchByStrict) {
          const {
            data: {
              id,
            },
          } = isMatchByStrict;

          this.setState(false, id);
        } else {
          const sortBySimiliarity = relatedGames.sort((a, b) =>
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

export default GameService;
