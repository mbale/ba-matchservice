import {
  Model,
  ActionTypes,
} from 'mongorito';

const {
  CREATE,
} = ActionTypes;


class Team extends Model {
  static collection() {
    return 'teams';
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
  Team.use(setDefaultFieldsOnCreate);
  return Team;
}

export default extendModel();
