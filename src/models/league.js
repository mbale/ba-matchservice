import {
  Model,
} from 'mongorito';

class League extends Model {
  static collection() {
    return 'leagues';
  }
}

function extendModel() {
  return League;
}

export default extendModel();
