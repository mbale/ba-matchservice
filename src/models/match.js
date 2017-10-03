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
      if (typeof fields.odds === 'undefined') {
        fields.odds = [];
        model.set('odds', []);
      }

      if (typeof fields._sources === 'undefined') {
        fields._sources = [];
        model.set('_sources', []);
      }

      if (typeof fields.periods === 'undefined') {
        fields.periods = [];
        model.set('periods', []);
      }
    }

    return next(action);
  } catch (error) {
    throw error;
  }
};

function extendModel() {
  Match.use(setDefaultFieldsOnCreate);
  return Match;
}

export default extendModel();
