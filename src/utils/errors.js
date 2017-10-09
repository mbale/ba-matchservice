class AppError extends Error {
  constructor(message) {
    // error constructor call.
    super(message);

    // stacktrace saving
    Error.captureStackTrace(this, this.constructor);

    // just in case we save name of class too
    this.name = this.constructor.name;
  }
}

class ApiKeysUsedError extends AppError {
  constructor(apiKeys) {
    super('All apikeys are used');

    this.apiKeys = apiKeys;
  }
}

export class OddsDuplicationError extends AppError {
  constructor(matchId, betType, bet, bets) {
    super(`Duplicate odds as ${JSON.stringify(bet)} in ${JSON.stringify(bets)} with matchId ${matchId}`);

    this.matchId = matchId;
    this.betType = betType;
    this.bet = bet;
    this.bets = bets;
  }
}

export class MatchUpdateDuplicationError extends AppError {
  constructor(matchId, update, updates) {
    super(`Duplicate update as ${JSON.stringify(update)} in ${JSON.stringify(updates)} with matchId ${matchId}`);

    this.matchId = matchId;
    this.update = update;
    this.updates = updates;
  }
}

export class InvalidSchemaBySourceError extends AppError {
  constructor(source, ...properties) {
    super(`Schema's invalid from source: ${source} with properties ${properties}`);

    this.source = source;
    this.properties = properties;
  }
}

export class MatchNotFoundBySourceError extends AppError {
  constructor(source, leagueId, matchId) {
    super(`Match's not found with matchId: ${matchId}, leagueId: ${leagueId} from ${source}`);

    this.source = source;
    this.leagueId = leagueId;
    this.matchId = matchId;
  }
}

export default {
  ApiKeysUsedError,
};
