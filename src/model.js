import {
  Model,
  ActionTypes,
} from 'mongorito';
import _ from 'lodash';
// import {
//   ThresholdInvalidError,
//   KeywordInvalidError,
//   KeywordDuplicationError,
// } from '~/errors.js';

/*
  Declaration
 */

class Match extends Model {
  static collection() {
    return 'matches';
  }
}

/*
  Extends
 */


/*
  Middlewares
 */

const setDefaultFields = () => {
  return ({ model }) => next => async (action) => {
    const { fields } = action;

    if (action.type === ActionTypes.CREATE) {
      console.log('-= Saving default fields =-');

      const leagueId = null;
      const scores = {};
      const changes = [];
      const keywords = {
        similar: [],
        different: [],
      };

      const constructChangeObj = (type, change, date = Date.now(), transactionId = fields.correlationId) => {
        return {
          type,
          change,
          date,
          transactionId,
        };
      };

      const snapshot = _.cloneDeep(fields);

      fields.leagueId = leagueId;
      model.set('leagueId', leagueId);

      fields.scores = scores;
      model.set('scores', scores);

      // set initial change
      const change = constructChangeObj('init', snapshot);
      changes.push(change);

      fields.changes = changes;
      model.set('changes', changes);

      fields.keywords = keywords;
      model.set('keywords', keywords);
    }
    return next(action);
  };
};

const logger = () =>
  ({ model }) => next => async (action) => {
    const { id, type } = action;

    if (type === ActionTypes.CREATE) {
      console.log('-= Saving entity =-');
    }

    if (action.type === ActionTypes.CREATED) {
      console.log(`entity_id: ${id}`);
      console.log(`entity_name: ${await model.get('name')}`);
    }
    return next(action);
  };

const initModel = () => {
  Match.use(setDefaultFields);
  Match.use(logger);

  return Match;
};

export default initModel();
