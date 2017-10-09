export const PinnaclePeriodNumberTypes = {
  Match: 'Match',
  Map1: 'Map1',
  Map2: 'Map2',
  Map3: 'Map3',
  Map4: 'Map4',
  Map5: 'Map5',
  Map6: 'Map6',
  Map7: 'Map7',
  Unknown: 'Unknown',
};

export const PinnaclePeriodStatusTypes = {
  Settled: 'Settled',
  ReSettled: 'ReSettled',
  Canceled: 'Canceled',
  ReSettleCancelled: 'ReSettleCancelled',
  Deleted: 'Deleted',
  Unknown: 'Unknown',
};

export const MatchSourceTypes = {
  Pinnacle: 'pinnacle',
  Oddsgg: 'oddsgg',
};

export const OddsSourceTypes = {
  Pinnacle: 'pinnacle',
};

export const PeriodSourceTypes = {
  Pinnacle: 'pinnacle',
};

export const QueueTypes = {
  MatchFetching: 'fetch-matches',
  MatchOddsFetching: 'fetch-match-odds',
  MatchUpdatesFetching: 'fetch-match-updates',
};

export const BetTypes = {
  Moneyline: 'Moneyline',
  Spread: 'Spread',
  Total: 'Total',
};

export const CacheTypes = {
  Odds: 'odds',
  Matches: 'matches',
  MatchUpdates: 'match-updates',
};

export const CacheSourceTypes = {
  Pinnacle: 'pinnacle',
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
