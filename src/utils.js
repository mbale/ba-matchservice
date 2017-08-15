import Joi from 'joi';
import {
  similarity,
} from 'talisman/metrics/distance/dice';
import {
  isSimilar,
} from 'talisman/metrics/distance/eudex';
import jaroWinkler from 'talisman/metrics/distance/jaro-winkler';
import mra from 'talisman/metrics/distance/mra';
import levenshtein from 'talisman/metrics/distance/levenshtein';
import Errors from './errors.js';

const {
  InvalidSchemaError,
} = Errors;

class Utils {
  /*
    Convert a buffer typed rabbitmq message to JSON object
  */
  static getContentAsJSON(message) {
    try {
      let {
        content,
      } = message;

      const {
        properties,
      } = message;

      content = JSON.parse(content.toString());
      return {
        content,
        properties,
      };
    } catch (error) {
      throw error;
    }
  }

  /*
    Comparators use it to set up information for each entity in terms of uniqueness in db
  */
  static state(unique = true, id = false) {
    const state = {
      unique,
      id,
    };

    return state;
  }

  /*
    Validate json schema
  */
  static validateSchema(schemaname, data, schema) {
    try {
      const {
        error,
      } = Joi.validate(data, schema);

      if (error) {
        throw new InvalidSchemaError(schemaname, data, error);
      }
    } catch (error) {
      throw error;
    }
  }

  /*
    Check similarity between two string
  */
  static similarityCalculation(from, to) {
    console.log('-= Calculating similarity =-');
    console.log(`entity_from: ${from}`);
    console.log(`entity_to: ${to}`);
    // const eudexValue = isSimilar(from, to); // similar
    const diceValue = similarity(from, to); // similar
    // const mraValue = mra(from, to); // similar
    const jaroWinklerValue = jaroWinkler(from, to); // distance
    const levenshteinValue = levenshtein(from, to); // metric distance
    // console.log(`eudex: ${eudexValue}`);
    console.log(`similarity: ${diceValue}`);
    console.log(`distance: ${levenshteinValue}`);
    return {
      dice: diceValue,
      jaroWinkler: jaroWinklerValue,
      levenshtein: levenshteinValue,
    };
  }

  /*
    Construct a similarity info object
  */
  static similarityType(type, entity, data = {}) {
    return {
      type,
      entity,
      data,
    };
  }
}

export default Utils;
