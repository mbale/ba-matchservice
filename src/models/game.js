import {
  Model,
  ActionTypes,
} from 'mongorito';

const {
  CREATE,
} = ActionTypes;

class Game extends Model {
  static collection() {
    return 'games';
  }
}

const setDefaultFieldsOnCreate = () => ({ model }) => next => async (action) => {
  try {
    const {
      fields,
      type,
    } = action;

    if (type === CREATE) {
      if (typeof fields.slug === 'undefined') {
        fields.slug = '';
        model.set('slug', '');
      }

      if (typeof fields.keywords === 'undefined') {
        fields.keywords = [];
        model.set('keywords', []);
      }
    }

    return next(action);
  } catch (error) {
    throw error;
  }
};

function extendModel() {
  Game.use(setDefaultFieldsOnCreate);

  return Game;
}

export default extendModel();
