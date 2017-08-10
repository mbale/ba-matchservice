import {
  Model,
} from 'mongorito';


class Game extends Model {
  static collection() {
    return 'games';
  }
}

export default Game;
