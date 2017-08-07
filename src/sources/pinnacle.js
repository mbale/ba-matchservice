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
    const leagueIds = [];

    /* eslint-disable no-await-in-loop, no-restricted-syntax */
    for (const league of leagues) {
      if (league.eventCount > 0) {
        leagueIds.push(league.id);
      }

      // we've match / league to save
      // pinnacle has got a technical issue when we request matches from empty league,
      // so we only can be sure such way we do not get into various of problems
      // if (eventCount > 0) {
      //   const {
      //     data,
      //   } = await axios.get(process.env.PINNACLE_GET_MATCHES_URL, {
      //     params: {
      //       sportId: process.env.PINNACLE_SPORTID,
      //       leagueIds: leagueId,
      //     },
      //     headers: {
      //       Authorization: `Basic ${process.env.PINNACLE_API_KEY}`,
      //     },
      //   });
      //   // get matches
      //   let {
      //     league: matchesOfLeague,
      //   } = data;

      //   // because of terrible schema of pinnacle that's why
      //   // we get all match for corresponding league
      //   matchesOfLeague = matchesOfLeague[0].events;

      //   for (const match of matchesOfLeague) {
      //     // restruct match objects
      //     const {
      //       starts: date,
      //     } = match;

      //     let {
      //       home: homeTeam,
      //       away: awayTeam,
      //     } = match;

      //     const firstBracketHomeTeam = homeTeam.indexOf('(');
      //     const firstBracketAwayTeam = awayTeam.indexOf('(');

      //     if (firstBracketHomeTeam !== -1) {
      //       homeTeam = homeTeam.substring(0, firstBracketHomeTeam);
      //     }

      //     if (firstBracketAwayTeam !== -1) {
      //       awayTeam = awayTeam.substring(0, firstBracketAwayTeam);
      //     }

      //     this.matches.push({
      //       homeTeam,
      //       awayTeam,
      //       league: leaguename,
      //       game: gamename,
      //       date,
      //     });
      //   }
      // }
    }

    const {
      data: {
        last,
        league: leaguesWithMatches,
      },
    } = await axios.get(process.env.PINNACLE_GET_MATCHES_URL, {
      params: {
        sportId: process.env.PINNACLE_SPORTID,
        leagueIds,
      },
      headers: {
        Authorization: `Basic ${process.env.PINNACLE_API_KEY}`,
      },
    });

    for (const leagueWithMatch of leaguesWithMatches) { // eslint-disable-line
      let {
        name: leaguename,
      } = leagueWithMatch;

      let gamename = '';

      // get gameType
      // TODO find gametype
      if (leaguename.indexOf('-') !== -1) {
        // split by '-' separator
        const namesInArray = leaguename.split('-', 2);
        // trim whitespace and set league name
        leaguename = namesInArray[1].trim();
        gamename = namesInArray[0].trim();
      }

      leagueWithMatch.events.forEach((match) => {
        const {
          starts: date,
        } = match;

        let {
          home: homeTeam,
          away: awayTeam,
        } = match;

        const firstBracketHomeTeam = homeTeam.indexOf('(');
        const firstBracketAwayTeam = awayTeam.indexOf('(');

        if (firstBracketHomeTeam !== -1) {
          homeTeam = homeTeam.substring(0, firstBracketHomeTeam);
        }

        if (firstBracketAwayTeam !== -1) {
          awayTeam = awayTeam.substring(0, firstBracketAwayTeam);
        }

        this.matches.push({
          homeTeam,
          awayTeam,
          league: leaguename,
          game: gamename,
          date,
        });
      });
    }
    return this.matches;
  }
}

export default PinnacleService;
