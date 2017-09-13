import {
  Model,
} from 'mongorito';

class Cache extends Model {
  static collection() {
    return 'caches';
  }
}

function extendModel() {
  return Cache;
}

export default extendModel();
