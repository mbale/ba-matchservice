import {
  Model,
  ActionTypes,
} from 'mongorito';

const {
  CREATE,
} = ActionTypes;

class Transaction extends Model {
  static collection() {
    return 'transactions';
  }
}

const setDefaultFieldsOnCreate = () => ({ model }) => next => async (action) => {
  try {
    const {
      fields,
      type,
    } = action;

    if (type === CREATE) {
      if (typeof fields.states === 'undefined') {
        const defaultState = {
          type: 'started',
          date: new Date(), // set default transaction state
        };

        fields.states = [defaultState];
        model.set('states', [defaultState]);
      }
    }

    return next(action);
  } catch (error) {
    throw error;
  }
};

function assignMethods(transactionModel) {
  const TransactionModel = transactionModel;

  TransactionModel.prototype.setSate = async function setState(type = '', date = new Date()) {
    try {
      const {
        states,
      } = await this.get();

      states.push({
        type,
        date,
      });

      this.set('states', states);

      await this.save();
    } catch (error) {
      throw error;
    }
  };
}


function extendTransaction() {
  Transaction.use(setDefaultFieldsOnCreate);
  Transaction.use(assignMethods);
  return Transaction;
}

export default extendTransaction();
