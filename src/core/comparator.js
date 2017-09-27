import {
  similarity,
} from 'talisman/metrics/distance/dice';
import levenshtein from 'talisman/metrics/distance/levenshtein';
import {
  initLoggerInstance,
} from '../utils/init.js';
import {
  CompareModeTypes,
  CompareResultTypes,
  CompareReasonTypes,
  RelationTypes,
  RelationSourceTypes,
} from '../utils/types.js';


const logger = initLoggerInstance();

class Comparator {
  static calculateSimilarity(stringTo, stringFrom) {
    return {
      dice: similarity(stringTo.toLowerCase(), stringFrom.toLowerCase()),  // similarity
      levenshtein: levenshtein(stringTo.toLowerCase(), stringFrom.toLowerCase()), // metric distance
    };
  }

  static compareStringsStrictly(stringToCompare, stringCompareWith) {
    return stringToCompare.toLowerCase() === stringCompareWith.toLowerCase();
  }

  static findStrictMatchInCollection(stringToCompare, collection = []) {
    return collection.find(item => item.toLowerCase() === stringToCompare.toLowerCase());
  }

  static findSimilarityInCollection(stringToCompare, keywords) {
    const keywordsOrdered = keywords.map((keyword) => {
      const {
        dice: diceValue,
        levenshtein: levenshteinValue,
      } = Comparator.calculateSimilarity(keyword, stringToCompare);
      return {
        keyword, // entity we
        diceValue,
        levenshteinValue,
      };
    }).sort((a, b) => (a.diceValue - b.diceValue));
    // return best
    if (keywordsOrdered.length !== 0) {
      return {
        dice: keywordsOrdered[keywordsOrdered.length - 1].diceValue,
        levenshtein: keywordsOrdered[keywordsOrdered.length - 1].levenshteinValue,
      };
    }
    return {}; // empty keywords
  }

  static compareEntityWithCollection(entityToCompare, collection = [], opts = {}) {
    const {
      mode: compareMode,
      thresholds: {
        dice: diceThreshold,
        levenshtein: levenshteinThreshold,
      },
    } = opts;
    try {
      // automatically sends back ok if we have empty collection
      if (collection.length === 0) {
        return {
          mode: compareMode,
          type: CompareResultTypes.New,
          source: RelationSourceTypes.Self,
          reason: CompareReasonTypes.NoRelation,
          entity: entityToCompare,
        };
      }

      const relatedEntites = [];

      /*
        Then we iterate all of it and compare
      */

      for (const item of collection) {
        const {
          name: identifier,
          keywords = [],
        } = item;

        // check in what mode we are
        // strict part
        if (compareMode === CompareModeTypes.StrictOnly
            || compareMode === CompareModeTypes.StrictAndSimilar) {
          // We compare the main identifier at first
          const identifierStrictlyEquals = Comparator
            .compareStringsStrictly(entityToCompare, identifier);
          // we store here if keyword equals
          const keywordStrictlyEquals = Comparator
            .findStrictMatchInCollection(entityToCompare, keywords);

          // then check what is strict
          if (identifierStrictlyEquals && keywordStrictlyEquals) {
            // if we've set up same keyword as identifier we take identifier prio
            relatedEntites.push({
              type: RelationTypes.Strict,
              source: RelationSourceTypes.Identifier,
              entity: item,
              value: true,
            });
          }

          if (identifierStrictlyEquals && !keywordStrictlyEquals) {
            relatedEntites.push({
              type: RelationTypes.Strict,
              source: RelationSourceTypes.Identifier,
              entity: item,
              value: true,
            });
          }

          if (keywordStrictlyEquals && !identifierStrictlyEquals) {
            relatedEntites.push({
              type: RelationTypes.Strict,
              source: RelationSourceTypes.Keyword,
              entity: item,
              value: true,
            });
          }
        }

        // similar part
        if (compareMode === CompareModeTypes.SimilarOnly
          || compareMode === CompareModeTypes.StrictAndSimilar) {
          // check identifier
          const {
            dice: identifierDiceIndex,
            levenshtein: identifierLsIndex,
          } = Comparator.calculateSimilarity(entityToCompare, identifier);

          const {
            dice: keywordDiceIndex = false, // empty keywords
            levenshtein: keywordLsIndex = false, // empty keywords
          } = Comparator.findSimilarityInCollection(entityToCompare, keywords);

          if (identifierDiceIndex >= diceThreshold
            && identifierLsIndex <= levenshteinThreshold) {
            relatedEntites.push({
              type: RelationTypes.Similar,
              source: RelationSourceTypes.Identifier,
              entity: item,
              value: identifierDiceIndex,
            });
          } else if (keywordDiceIndex >= diceThreshold
            && keywordLsIndex <= levenshteinThreshold) {
            // and keywords if we have no result from main index as identifier
            relatedEntites.push({
              type: RelationTypes.Similar,
              source: RelationSourceTypes.Keyword,
              entity: item,
              value: keywordDiceIndex,
            });
          }
        }
      }

      // if we do not have any related
      if (relatedEntites.length === 0) {
        return {
          mode: compareMode,
          type: CompareResultTypes.New,
          source: RelationSourceTypes.Self,
          reason: CompareReasonTypes.NoRelation,
          entity: entityToCompare,
        };
      }

      // get the best similar
      const strictEntity = relatedEntites
        .find(relatedEntity => relatedEntity.type === RelationTypes.Strict);

      const similarEntities = relatedEntites
        .filter(relatedEntity => relatedEntity.type === RelationTypes.Similar)
        .sort((a, b) => (a.value - b.value));

      const similarEntity = similarEntities[similarEntities.length - 1];

      // order is important
      if (strictEntity) {
        return {
          mode: compareMode,
          type: CompareResultTypes.Existing,
          source: strictEntity.source,
          reason: CompareReasonTypes.StrictMatch,
          entity: strictEntity.entity,
        };
      }

      if (similarEntity) {
        return {
          mode: compareMode,
          type: CompareResultTypes.Existing,
          source: similarEntity.source,
          reason: CompareReasonTypes.SimilarMatch,
          entity: similarEntity.entity,
        };
      }

      // just in case
      return {
        mode: compareMode,
        type: CompareResultTypes.New,
        source: RelationSourceTypes.Self,
        reason: CompareReasonTypes.NoRelation,
        entity: entityToCompare,
      };
    } catch (error) {
      logger.error(error);
      return {
        mode: compareMode,
        type: CompareResultTypes.New,
        source: RelationSourceTypes.Self,
        reason: CompareReasonTypes.Fallback,
        entity: entityToCompare,
      };
    }
  }
}

export default Comparator;
