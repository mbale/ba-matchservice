import {
  Model,
} from 'mongorito';

class Team extends Model {
  static collection() {
    return 'teams';
  }
}

function extendModel() {
  return Team;
}

export default extendModel();
