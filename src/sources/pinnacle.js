import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class PinnacleService {
  async getMatches() {
    const {
      data: {
        leagues,
      },
    } = await axios.get(process.env.PINNACLE_GET_LEAGUES_URL, {
      params: {
        sportid: process.env.PINNACLE_SPORTID,
      },
      headers: {
        Authorization: `Basic ${process.env.PINNACLE_API_KEY}`,
      },
    });

    this.leagues = leagues;
    this.matches = [];

    /* eslint-disable no-await-in-loop, no-restricted-syntax */
    for (const league of leagues) {
      let {
        name: leaguename,
      } = league;

      let gamename = '';

      const {
        id: leagueId,
        eventCount,
      } = league;

      // get gameType
      // TODO find gametype
      if (leaguename.indexOf('-') !== -1) {
        // split by '-' separator
        const namesInArray = leaguename.split('-', 2);
        // trim whitespace and set league name
        leaguename = namesInArray[1].trim();
        gamename = namesInArray[0].trim();
      }

      // we've match / league to save
      // pinnacle has got a technical issue when we request matches from empty league,
      // so we only can be sure such way we do not get into various of problems
      if (eventCount > 0) {
        const {
          data,
        } = await axios.get(process.env.PINNACLE_GET_MATCHES_URL, {
          params: {
            sportId: process.env.PINNACLE_SPORTID,
            leagueIds: leagueId,
          },
          headers: {
            Authorization: `Basic ${process.env.PINNACLE_API_KEY}`,
          },
        });
        // get matches
        let {
          league: matchesOfLeague,
        } = data;

        // because of terrible schema of pinnacle that's why
        // we get all match for corresponding league
        matchesOfLeague = matchesOfLeague[0].events;

        for (const match of matchesOfLeague) {
          // restruct match objects
          const {
            home: homeTeam,
            away: awayTeam,
            starts: date,
          } = match;

          this.matches.push({
            homeTeam,
            awayTeam,
            league: leaguename,
            game: gamename,
            date,
          });
        }
      }
    }
    return this.matches;
  }
}

export default PinnacleService;
