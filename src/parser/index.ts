import { MatchSource } from 'ba-common';

export interface RawMatch {
  homeTeam : string;
  awayTeam : string;
  game : string;
  league : string;
  _source : MatchSource;
  date : Date;
}

async function matchParser(matchInRaw : RawMatch) {
  try {
    
  } catch (error) {
    
  }
}

export default matchParser;
