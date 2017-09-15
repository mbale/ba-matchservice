import {
  Model,
  ActionTypes,
} from 'mongorito';

const {
  CREATE,
} = ActionTypes;

class League extends Model {
  static collection() {
    return 'leagues';
  }
}

const setDefaultFieldsOnCreate = () => ({ model }) => next => async (action) => {
  try {
    const {
      fields,
      type,
    } = action;

    if (type === CREATE) {
      if (typeof fields.verified === 'undefined') {
        fields.verified = false;
        model.set('verified', false);
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
  League.use(setDefaultFieldsOnCreate);
  return League;
}

export default extendModel();
