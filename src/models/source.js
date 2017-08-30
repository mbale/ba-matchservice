import {
  Model,
} from 'mongorito';

class Source extends Model {
  static collection() {
    return 'sources';
  }
}

function extendModel() {
  return Source;
}

export default extendModel();
