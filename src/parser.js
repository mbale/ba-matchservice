import {
  ObjectId,
} from 'mongorito';
import Match from './models/match.js';
import Game from './models/game.js';
import League from './models/league.js';
import Team from './models/team.js';
import Comparator, {
  CompareResultTypes,
} from './comparator.js';

const ParserResultTypes = {
  Fresh: 'Fresh',
  Duplicate: 'Duplication',
  Invalid: 'Invalid',
};

class MatchParser {
  constructor(opts = {
    debug: false,
  }) {
    this.debugMode = opts.debug;
    const debugMode = this.debugMode;

    console.log(`Initiating MatchParser with debug mode: ${debugMode}`);
    if (debugMode) {
      console.log('We won\'t save anything');
    }
  }

  async analyze(matchToTry, opts = {}) {
    try {
      const debugMode = this.debugMode;

      const {
        homeTeam: homeTeamname,
        awayTeam: awayTeamname,
        league: leaguename,
        game: gamename,
      } = matchToTry;

      const {
        homeTeam: homeTeamComparatorOpts,
        awayTeam: awayTeamComparatorOpts,
        league: leagueComparatorOpts,
        game: gameComparatorOpts,
      } = opts;

      let {
        date,
      } = matchToTry;

      //  Schema check
      if (!homeTeamname || !awayTeamname || !leaguename || !gamename || !date) {
        return ParserResultTypes.Invalid;
      }

      date = new Date(date);

      // get collections
      let [
        gameCollection,
        leagueCollection,
        teamCollection,
      ] = await Promise.all([
        Game.find(),
        League.find(),
        Team.find(),
      ]);

      gameCollection = await Promise.all(gameCollection.map(game => game.get()));
      leagueCollection = await Promise.all(leagueCollection.map(league => league.get()));
      teamCollection = await Promise.all(teamCollection.map(team => team.get()));

      // get results
      const [
        {
          type: gameComparatorResult,
          entity: gameEntity,
        },
        {
          type: leagueComparatorResult,
          entity: leagueEntity,
        },
        {
          type: homeTeamComparatorResult,
          entity: homeTeamEntity,
        },
        {
          type: awayTeamComparatorResult,
          entity: awayTeamEntity,
        },
      ] = await Promise.all([
        Comparator.compareEntityWithCollection(
          gamename, gameCollection, gameComparatorOpts,
        ),
        Comparator.compareEntityWithCollection(
          leaguename, leagueCollection, leagueComparatorOpts,
        ),
        Comparator.compareEntityWithCollection(
          homeTeamname, teamCollection, homeTeamComparatorOpts,
        ),
        Comparator.compareEntityWithCollection(
          awayTeamname, teamCollection, awayTeamComparatorOpts,
        ),
      ]);


      // dupe check
      const andQuery = {
      };

      if (date) {
        andQuery.date = date;
      }

      if (leagueComparatorResult === CompareResultTypes.Existing) {
        andQuery.league = new ObjectId(leagueEntity._id);
      }

      if (homeTeamComparatorResult === CompareResultTypes.Existing) {
        andQuery.homeTeam = new ObjectId(homeTeamEntity._id);
      }

      if (awayTeamComparatorResult === CompareResultTypes.Existing) {
        andQuery.awayTeam = new ObjectId(awayTeamEntity._id);
      }

      const similarMatch = await Match.findOne(andQuery);

      if (similarMatch) {
        const debugMatch = JSON.stringify(await similarMatch.get(), null, 4);
        console.log(`Similar match: ${debugMatch}`);
        return ParserResultTypes.Duplicate;
      }

      // only save if no debug mode and similarmatch
      // save
      if (!debugMode) {
        let game = null;
        let league = null;
        let homeTeam = null;
        let awayTeam = null;

        const entities = [];

        if (gameComparatorResult === CompareResultTypes.New) {
          game = new Game({
            name: gameEntity,
          });
          entities.push(game.save());
        } else {
          entities.push({
            id: gameEntity._id,
          });
        }

        if (leagueComparatorResult === CompareResultTypes.New) {
          league = new League({
            name: leagueEntity,
          });
          entities.push(league.save());
        } else {
          entities.push({
            id: leagueEntity._id,
          });
        }

        if (homeTeamComparatorResult === CompareResultTypes.New) {
          homeTeam = new Team({
            name: homeTeamEntity,
          });
          entities.push(homeTeam.save());
        } else {
          entities.push({
            id: homeTeamEntity._id,
          });
        }

        if (awayTeamComparatorResult === CompareResultTypes.New) {
          awayTeam = new Team({
            name: awayTeamEntity,
          });
          entities.push(awayTeam.save());
        } else {
          entities.push({
            id: awayTeamEntity._id,
          });
        }

        const [{
          id: gameId,
        }, {
          id: leagueId,
        }, {
          id: homeTeamId,
        }, {
          id: awayTeamId,
        }] = await Promise.all(entities);

        const match = new Match({
          league: leagueId,
          game: gameId,
          homeTeam: homeTeamId,
          awayTeam: awayTeamId,
          date,
        });

        const {
          id: matchId,
        } = await match.save();

        const debugMatch = JSON.stringify(matchId, null, 4);
        console.log(`Unique match: ${debugMatch}`);
        return ParserResultTypes.Fresh;
      }

      return ParserResultTypes.Fresh;
    } catch (error) {
      console.log(error)
      throw error;
    }
  }
}

export default MatchParser;
export {
  ParserResultTypes,
};
