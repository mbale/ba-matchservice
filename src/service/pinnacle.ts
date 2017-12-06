import * as dotenv from 'dotenv';
import axios from 'axios';
import { RawMatch } from '../service/parser';
import { MatchSourceType, MatchSource } from 'ba-common';
import { List, Map } from 'immutable';
import { Service, Inject } from 'typedi';

dotenv.config();

const GET_LEAGUES_URL = process.env.PINNACLE_GET_LEAGUES_URL;
const GET_MATCHES_URL = process.env.PINNACLE_GET_MATCHES_URL;
const SPORT_ID = process.env.PINNACLE_SPORT_ID;
const API_KEY = process.env.PINNACLE_API_KEY;

export interface PinnacleServiceOpts {
  getLeaguesUrl : string;
  getMatchesUrl : string;
  sportId : number;
  apiKey : string;
}

export interface MatchFetchResult {
  source : MatchSourceType;
  matches : RawMatch[];
  lastFetchTime : string;
}

/**
 * Map and check data in format
 * 
 * @param {any} args 
 * @returns {RawMatch} 
 */
function serializeMatchData(...args): RawMatch {

  // homeTeam: string, awayTeam: string, 
  // league: string, game: string, date: Date, _source: MatchSource
  // find for empty strings
  const empty = args.every(arg => arg !== '');
  // find for undefined
  const undefined = args.every(arg => arg !== 'undefined');

  if (empty && undefined) {
    return {
      homeTeam: args[0],
      awayTeam: args[1],
      league: args[2],
      game: args[3],
      date: args[4],
      _source: args[5],
    };
  }

  throw Error('Missing data');
}

/**
 * Contains communication logics to pinnacle
 * 
 * @class PinnacleService
 */
@Service()
class PinnacleService {
  @Inject('pinnacleservice.options')
  private opts : PinnacleServiceOpts;
  @Inject('pinnacleservice.last')
  private last: string = null;

  /**
   * Pinnacle has differentations sometimes in entity names
   * we remove that
   * 
   * @static
   * @param {string} entityToCheck 
   * @returns 
   * @memberof PinnacleService
   */
  findAndRemoveKeywords(entityToCheck: string) {
    // pinnacle related keywords
    // only pass here lowercase keywords
    const keywords = ['live', 'esports'];
    let entity = entityToCheck.trim();
    // we convert to find keywords
    const entityLowerCase = entity.toLowerCase();

    keywords.forEach((keyword) => {
      // we check if keyword is in string
      if (entityLowerCase.includes(keyword)) {
        // get first index of the keywords
        const keywordStartIndex = entityLowerCase.indexOf(keyword, 0);
        // check where it ends
        const keywordEndIndex = keywordStartIndex + keyword.length;
        // cut out rest
        entity = entity.substring(keywordEndIndex, entityLowerCase.length).trim();
      }
    });

    return entity;
  }

  /**
   * Pinnacle occasionally has wrong data in their db
   * 
   * @param {string} value 
   * @returns {boolean} 
   * @memberof PinnacleService
   */
  identifyFakeData(value: string): boolean {
    if (value.toLowerCase().includes('please')) {
      return true;
    }
    return false;
  }

  /**
   * Split leaguename into game and league name
   * 
   * @param {string} leaguename 
   * @returns 
   * @memberof PinnacleService
   */
  splitLeagueIntoLeagueAndGame(leaguename: string) {
    let league = leaguename;
    let game = null;
    // include here pinnacle related separators
    // order is important e.g cs:go - all stars
    const separators = ['-', ':'];
    // we only split once
    let alreadySplitted : boolean = null;

    // find for separators
    for (const separator of separators) {
      if (league.indexOf(separator) !== -1 && !alreadySplitted) {
        const namesInArray = league.split(separator, 2);
        // trim whitespace and set both fields
        league = namesInArray[1].trim();
        game = namesInArray[0].trim();
        alreadySplitted = true;
      }
    }

    return {
      league,
      game,
    };
  }

  /**
   * Often pinnacle stores in teamname the objective type of match (1st kills) etc
   * 
   * @param {string} teamname 
   * @param {string} segment 
   * @returns 
   * @memberof PinnacleService
   */
  removeMapSegmentFromTeam(teamname: string, segment: string) {
    let team = teamname;

    // we find first occurance of segment
    const startOfSegment = team.indexOf(segment);

    // we found segment
    if (startOfSegment !== -1) {
      // cut out the original team name name
      team = team.substring(0, startOfSegment).trim();
    }

    return team;
  }

  /**
   * Fetch matches from pinnacle
   * 
   * @returns {Promise<MatchFetchResult>} 
   * @memberof PinnacleService
   */
  async fetchMatches() : Promise<MatchFetchResult> {
    try {
      let {
        data: {
          leagues,
        },
      } = await axios.get(this.opts.getLeaguesUrl, {
        params: {
          sportId: this.opts.sportId,
        },
        headers: {
          Authorization: `Basic ${this.opts.apiKey}`,
        },
      });

      const source = MatchSourceType.Pinnacle;
      const matches : RawMatch[] = [];

      // filter them by matches
      leagues = leagues.filter(league => league.eventCount > 0);

      const {
        data,
      } = await axios.get(this.opts.getMatchesUrl, {
        params: {
          sportId : this.opts.sportId,
          leagueIds : leagues.map(l => l.id),
        },
        headers: {
          Authorization: `Basic ${this.opts.apiKey}`,
        },
      });

      // can be empty string even if request was made with json header
      if (data !== '') {
        const {
          last,
          league: leaguesWithMatches,
        } = data;

        // assign cache
        this.last = last;

        for (const leagueWithMatch of leaguesWithMatches) {
          let {
            name: leaguename,
          } = leagueWithMatch;
  
          const {
            id: leagueId,
          } = leagueWithMatch;
  
          let gamename = null;
  
          // split into game and league
          const {
            league,
            game,
          } = this.splitLeagueIntoLeagueAndGame(leaguename);
          // get data
          leaguename = league;
          gamename = game;
  
          // strip out irrelevant keywords
          gamename = this.findAndRemoveKeywords(gamename);
  
          for (const match of leagueWithMatch.events) {
            const {
              starts: date,
              id: matchId,
            } = match;
  
            let {
              home: homeTeam,
              away: awayTeam,
            } = match;

            const isItFake = this.identifyFakeData(homeTeam) || this.identifyFakeData(awayTeam);

            // check if data includes wrong data and drop it
            if (isItFake) {
              break;
            }
  
            // we find (map) segment
            homeTeam = this.removeMapSegmentFromTeam(homeTeam, '(');
            awayTeam = this.removeMapSegmentFromTeam(awayTeam, '(');

            try {
              const serialized = 
              serializeMatchData(homeTeam, awayTeam, leaguename, gamename, date, {
                leagueId,
                matchId,
                type: source,
                fetchedAt: new Date(),
              });

              matches.push(serialized);
            } catch (error) {
              console.log(error)
            }
          }
        }
      }

      return {
        source,
        matches,
        lastFetchTime: this.last,
      };
    } catch (error) {
      throw error;
    }
  }
}

export default PinnacleService;
