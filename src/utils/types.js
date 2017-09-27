export const QueueTypes = {
  MatchFetching: 'match-fetching',
  OddsUpdating: 'odds-updating',
};

export const BetTypes = {
  Moneyline: 'Moneyline',
  Spread: 'Spread',
  Total: 'Total',
};

export const CacheTypes = {
  Odds: 'Odds',
  Matches: 'Matches',
};

export const CacheSourceTypes = {
  Pinnacle: 'Pinnacle',
};

export const CompareModeTypes = {
  StrictAndSimilar: 'StrictAndSimilar',
  StrictOnly: 'StrictOnly', // default
  SimilarOnly: 'SimilarOnly',
};

export const CompareResultTypes = {
  Existing: 'Existing',
  New: 'New',
};

export const CompareReasonTypes = {
  StrictMatch: 'StrictMatch',
  SimilarMatch: 'SimilarMatch',
  NoRelation: 'NoRelation',
  Fallback: 'Fallback',
};

export const RelationTypes = {
  Strict: 'Strict',
  Similar: 'Similar',
};

export const RelationSourceTypes = {
  Keyword: 'Keyword',
  Identifier: 'Identifier',
  Self: 'Self',
};

export const ParserResultTypes = {
  Fresh: 'Fresh',
  Duplicate: 'Duplication',
  Invalid: 'Invalid',
};
