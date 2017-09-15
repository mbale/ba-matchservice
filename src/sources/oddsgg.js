import axios from 'axios';
import dotenv from 'dotenv';
import ApiKeysUsedError from '../errors.js';

dotenv.config();

class OddsggSource {
  static async getMatches(opts = {}) {
    const API_KEYS = process.env.ODDSGG_API_KEYS.split(',');
    const GET_MATCHES_URL = process.env.ODDSGG_GET_MATCHES_URL;
    const GET_LEAGUES_URL = process.env.ODDSGG_GET_LEAGUES_URL;

    let needToFetch = true;
    let usedTokenIndex = 0;

    let matches = null;
    let leagues = null;

    // set def headers for all requests
    const axiosInstance = axios.create();

    try {
      do {
        // check if we used all token
        if (usedTokenIndex > API_KEYS.length) {
          throw new ApiKeysUsedError(API_KEYS);
        }
        try {
          axiosInstance.defaults.headers.common['Api-Key'] = API_KEYS[usedTokenIndex];
          // isupdate is bugged so we use no cache just pull everything
          axiosInstance.defaults.headers.common.isUpdate = false;

          const resourcesToGet = [];

          // first run
          if (!matches && !leagues) {
            resourcesToGet.push(axiosInstance.get(GET_MATCHES_URL));
            resourcesToGet.push(axiosInstance.get(GET_LEAGUES_URL));
            // watch out for order
            const [{
              data: matchesData,
            }, {
              data: leaguesData,
            }] = await Promise.all(resourcesToGet);
            matches = matchesData;
            leagues = leaguesData;
            needToFetch = false;
          }

          // if any apikey is limited on the next try
          if (matches && !leagues) {
            const {
              data: leaguesData,
            } = await axiosInstance.get(GET_LEAGUES_URL);
            leagues = leaguesData;
            needToFetch = true;
          }

          if (leagues && !matches) {
            const {
              data: matchesData,
            } = await axiosInstance.get(GET_MATCHES_URL);
            matches = matchesData;
            needToFetch = true;
          }
        } catch (error) {
          if (typeof error.response !== 'undefined'
          && typeof error.response.status !== 'undefined') { // only +400 errors listed here otherwise undefined the whole resp
            if (error.response.status === 429) {
              usedTokenIndex += 1;
            }
          }
        }
      } while (needToFetch);
    } catch (error) {
      // rethrow because we don't want to continue when we have issue with getting data
      throw error;
    }


    const matchesInSchema = [];

    for (const match of matches) {
      const matchInSchema = {};
      // 1.) get game type (from tournament and league)
      // worst schema structure i've ever seen so we rebuild it
      for (const league of leagues) {
        const sameTournamentIndex = league.Tournaments
          .findIndex((tournament => match.TournamentId === tournament.Id));

        // get corresponding game and leaguename
        if (sameTournamentIndex !== -1) {
          matchInSchema.game = league.CategoryName;
          matchInSchema.league = league.Tournaments[sameTournamentIndex].Name;
        }
      }
      // then assign team and date info
      matchInSchema.homeTeam = match.HomeTeamName;
      matchInSchema.awayTeam = match.AwayTeamName;
      matchInSchema.date = match.StartTime;
      matchesInSchema.push(matchInSchema);
    }

    return {
      type: 'oddsgg',
      matches: matchesInSchema,
    };

    // const matches = data.map(({
    //   StartTime,
    //   TournamentId,
    //   HomeTeamName,
    //   awayTeamName,
    // }) => {

    // });

    // console.log(matches.length)

    // return matches;
  }
}

export default OddsggSource;
