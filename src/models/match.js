import {
  Model,
} from 'mongorito';
import Joi from 'joi';

class Match extends Model {
  static collection() {
    return 'matches';
  }
}

function extendModel() {
  return Match;
}

export default extendModel();
