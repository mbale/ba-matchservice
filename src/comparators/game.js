import {
  ObjectId,
} from 'mongorito';
import Utils from '../utils.js';

class GameComparator {
  static async findSimilar(game, gameCollection, opts = {}) {
    const games = gameCollection;
    const gamenameToCheck = game;

    let state = null;

    const gamenameLowercase = gamenameToCheck.toLowerCase();

    const {
      algoCheck = false,
    } = opts;

    if (games.length === 0) {
      state = Utils.state();
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
        state = Utils.state();
      } else {
        const isMatchByStrict = relatedGames.find(relatedGame => relatedGame.type === 'strict');

        // if we found strictly equivalent
        if (isMatchByStrict) {
          const {
            data: {
              id,
            },
          } = isMatchByStrict;

          state = Utils.state(false, id);
        } else {
          const sortBySimiliarity = relatedGames.sort((a, b) =>
            (a.data.similarity - b.data.similarity));

          const {
            id,
          } = sortBySimiliarity[sortBySimiliarity.length - 1];

          Utils.state(false, id);
        }
      }
    }
    return state;
  }
}

export default GameComparator;
