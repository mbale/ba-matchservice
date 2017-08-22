import Utils from '../utils.js';

class GameComparator {
  static async findSimilar(gamename, gameCollection, opts = {}) {
    const gamenameLowercase = gamename.toLowerCase();
    const games = gameCollection;

    let gameEntity = null;

    const {
      algoCheck = false,
    } = opts;

    if (games.length > 0) {
      const relatedGames = [];

      // we check similarity with every entity in db
      for (const game of games) {
        const gamenameInDb = await game.get('name');

        const strictlyEquals = gamenameInDb.toLowerCase() === gamenameLowercase;

        // strictly equal
        if (strictlyEquals) {
          relatedGames.push(Utils.similarityType('strict', game));
        }

        if (algoCheck && !strictlyEquals) {
          const {
            dice: diceValue, // int
            levenshtein: levenshteinValue,
          } = Utils.similarityCalculation(gamenameInDb, gamename);

          if (diceValue >= 0.7 && levenshteinValue <= 3) {
            // similar but char differences are between ]0,3] equal by length
            relatedGames.push(Utils.similarityType('algo', game, {
              similarity: diceValue,
              distance: levenshteinValue,
            }));
          }
        }
      }

      if (relatedGames.length > 0) {
        const isMatchByStrict = relatedGames.find(relatedGame => relatedGame.type === 'strict');

        // if we found strictly equivalent
        if (isMatchByStrict) {
          const {
            entity,
          } = isMatchByStrict;

          gameEntity = entity;
        } else {
          const sortBySimiliarity = relatedGames.sort((a, b) =>
            (a.data.similarity - b.data.similarity));

          const {
            entity,
          } = sortBySimiliarity[sortBySimiliarity.length - 1];

          gameEntity = entity;
        }
      }
    }
    return gameEntity;
  }
}

export default GameComparator;
