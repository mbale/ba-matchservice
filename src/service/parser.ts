import { MatchSource } from 'ba-common';
import * as winston from 'winston';

export interface RawMatch {
  homeTeam : string;
  awayTeam : string;
  game : string;
  league : string;
  _source : MatchSource;
  date : Date;
}

class MatchParserService {
  constructor() {}
}

export default MatchParserService;
