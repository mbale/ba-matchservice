import Utils from '../utils.js';
import Types from '../types.js';

const {
  ModeTypes,
} = Types;

class GameComparator {
  static async findSimilar(gamename, gameCollection, opts = {}) {
    const {
      mode = ModeTypes.StrictOnly, // default
      thresholds = {
        dice: 0.7, // default
        levenshtein: 3, // default
      },
    } = opts;

    const gamenameLowercase = gamename.toLowerCase();
    const games = gameCollection;

    let gameEntity = null;

    if (games.length > 0) {
      const relatedGames = [];

      // we check similarity with every entity in db
      for (const game of games) {
        const gamenameInDb = await game.get('name');
        const keywords = await game.get('keywords') || [];

        // TODO: forbidden check
        /*
          1.) Strict check
          // default if mode was not set up
        */
        if (mode === ModeTypes.StrictOnly || mode === ModeTypes.StrictAndSimilar) {
          const strictlyEquals = gamenameInDb.toLowerCase() === gamenameLowercase;
          const keywordEquals = keywords.includes(keyword =>
            keyword.toLowerCase() === gamenameLowercase);

          // strictly equal
          if (strictlyEquals || keywordEquals) {
            relatedGames.push(Utils.similarityType('strict', game));
          }
        }

        /*
          2.) (optional) similarity check
          TOOD: implement keyword checking
        */
        if (mode === ModeTypes.SimilarOnly || mode === ModeTypes.StrictAndSimilar) {
          const {
            dice: diceValue, // similar
            levenshtein: levenshteinValue, // metric distance
          } = Utils.similarityCalculation(gamenameInDb, gamename);

          if (diceValue >= thresholds.dice && levenshteinValue <= thresholds.levenshtein) {
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
