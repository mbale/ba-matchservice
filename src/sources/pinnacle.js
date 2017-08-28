import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class PinnacleSource {
  // pinnacle has differentations sometimes in entity names
  // we remove that
  static findAndRemoveKeywords(entityToCheck) {
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

  // pinnacle stores gametype and leaguetype together in leaguename
  static splitNameIntoLeagueAndGame(leaguename) {
    let league = leaguename;
    let game = null;
    // include here pinnacle related separators
    const separators = [':', '-'];
    // we only split once
    let alreadySplitted = null;

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

  // often pinnacle stores in teamname the objective type of match (1st kills) etc
  static removeMapSegmentFromTeam(teamname, segment) {
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

  static async getMatches(since, opts = {}) {
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

    let lastFetchTime = null;
    const matches = [];
    const leagueIds = [];

    /* eslint-disable no-await-in-loop, no-restricted-syntax */
    for (const league of leagues) {
      if (league.eventCount > 0) {
        leagueIds.push(league.id);
      }
    }

    const matchParams = {
      sportId: process.env.PINNACLE_SPORTID,
      leagueIds,
    };

    if (since) {
      matchParams.since = since;
    }

    const {
      data,
    } = await axios.get(process.env.PINNACLE_GET_MATCHES_URL, {
      params: matchParams,
      headers: {
        Authorization: `Basic ${process.env.PINNACLE_API_KEY}`,
      },
    });

    // pinnacle sends empty string in response if there is no content since
    // yupp with json header
    if (data !== '') {
      const {
        last,
        league: leaguesWithMatches,
      } = data;

      // assign last time
      lastFetchTime = last;

      for (const leagueWithMatch of leaguesWithMatches) {
        let {
          name: leaguename,
        } = leagueWithMatch;

        let gamename = null;
        console.log(leaguename)

        // split into game and league
        const {
          league,
          game,
        } = PinnacleSource.splitNameIntoLeagueAndGame(leaguename);
        // get data
        leaguename = league;
        gamename = game;

        // strip out irrelevant keywords
        gamename = PinnacleSource.findAndRemoveKeywords(gamename);

        leagueWithMatch.events.forEach((match) => {
          const {
            starts: date,
          } = match;

          let {
            home: homeTeam,
            away: awayTeam,
          } = match;

          // we find (map) segment
          homeTeam = PinnacleSource.removeMapSegmentFromTeam(homeTeam, '(');
          awayTeam = PinnacleSource.removeMapSegmentFromTeam(awayTeam, '(');

          homeTeam = PinnacleSource.findAndRemoveKeywords(homeTeam);
          awayTeam = PinnacleSource.findAndRemoveKeywords(awayTeam);

          matches.push({
            homeTeam,
            awayTeam,
            league: leaguename,
            game: gamename,
            date,
          });
        });
      }
    }

    return {
      type: 'pinnacle',
      matches,
      lastFetchTime,
    };
  }
}

export default PinnacleSource;
