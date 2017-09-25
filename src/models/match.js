import {
  Model,
  ActionTypes,
} from 'mongorito';

const {
  CREATE,
} = ActionTypes;

class Match extends Model {
  static collection() {
    return 'matches';
  }
}

const setDefaultFieldsOnCreate = () => ({ model }) => next => async (action) => {
  try {
    const {
      fields,
      type,
    } = action;

    if (type === CREATE) {
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
  //Match.use(setDefaultFieldsOnCreate);
  return Match;
}

export default extendModel();
