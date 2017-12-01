import * as dotenv from 'dotenv';
import axios from 'axios';
import { RawMatch } from '../parser/index';
import { MatchSourceType } from 'ba-common';
import { List, Map } from 'immutable';

dotenv.config();

const GET_LEAGUES_URL = process.env.PINNACLE_GET_LEAGUES_URL;
const GET_MATCHES_URL = process.env.PINNACLE_GET_MATCHES_URL;
const SPORT_ID = process.env.PINNACLE_SPORT_ID;
const API_KEY = process.env.PINNACLE_API_KEY;

interface PinnacleServiceOpts {
  getLeaguesUrl : string;
  getMatchesUrl : string;
  sportId : number;
  apiKey : string;
}

interface MatchFetchResult {
  source : MatchSourceType;
  matches : RawMatch[];
  lastFetchTime : Date;
}

/**
 * Contains communication logics to pinnacle
 * 
 * @class PinnacleService
 */
class PinnacleService {
  private opts : PinnacleServiceOpts = null;

  /**
   * Creates an instance of PinnacleService.
   * @param {PinnacleServiceOpts} opts 
   * @memberof PinnacleService
   */
  constructor(opts : PinnacleServiceOpts) {
    if (!opts) {
      throw new Error('Missing options');
    }
    this.opts = opts;
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
      let lastFetchTime : Date = null;

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
        lastFetchTime = last;

        // leagueId <-> matches
        const map = Map<string, RawMatch[]>();

        for (const leagueWithMatch of leaguesWithMatches) {
          console.log(leagueWithMatch)
        }
      }

      return {
        source,
        matches,
        lastFetchTime,
      };
    } catch (error) {
      console.log(error)
    }
  }
}

export default PinnacleService;
