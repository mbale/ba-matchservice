import {
  Model,
} from 'mongorito';

class Odds extends Model {
  static collection() {
    return 'odds';
  }
}

function extendModel() {
  return Odds;
}

export default extendModel();
