import {
  ObjectId,
} from 'mongorito';
import Comparator, {
  CompareResultTypes,
} from './comparator.js';
import {
  initLoggerInstance,
} from './init.js';
import Match from './models/match.js';
import League from './models/league.js';
import Team from './models/team.js';
import Game from './models/game.js';

const ParserResultTypes = {
  Fresh: 'Fresh',
  Duplicate: 'Duplication',
  Invalid: 'Invalid',
};

const logger = initLoggerInstance();

class MatchParser {
  constructor(opts = {
    debug: false,
  }) {
    this.debugMode = opts.debug;
    const debugMode = this.debugMode;

    logger.info(`Initiating MatchParser with debug mode: ${debugMode}`);
    if (debugMode) {
      logger.info('We won\'t save anything');
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
        _sources,
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

      /*
        Duplication check
      */

      // dupe check
      const andQuery = [
        {
          date,
        }, // it's needed because otherwise we would loss multiple matches with same team
      ];

      let canQuery = false;

      if (homeTeamComparatorResult === CompareResultTypes.Existing) {
        canQuery = true;
        andQuery.push({
          'homeTeam._id': new ObjectId(homeTeamEntity._id),
        });
      }

      if (awayTeamComparatorResult === CompareResultTypes.Existing) {
        canQuery = true;
        andQuery.push({
          'awayTeam._id': new ObjectId(awayTeamEntity._id),
        });
      }

      if (canQuery) {
        const similarMatch = await Match
          .and(andQuery)
          .findOne();

        if (similarMatch) {
          logger.info(`Similar match with id: ${await similarMatch.get('_id')}`);
          return ParserResultTypes.Duplicate;
        }
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

        const [
          gameInDb,
          leagueInDb,
          homeTeamInDb,
          awayTeamInDb,
        ] = await Promise.all([
          Game.findOne({
            _id: new ObjectId(gameId),
          }),
          League.findOne({
            _id: new ObjectId(leagueId),
          }),
          Team.findOne({
            _id: new ObjectId(homeTeamId),
          }),
          Team.findOne({
            _id: new ObjectId(awayTeamId),
          }),
        ]);

        // assign whole instances
        game = await gameInDb.get();
        league = await leagueInDb.get();
        homeTeam = await homeTeamInDb.get();
        awayTeam = await awayTeamInDb.get();

        const match = new Match({
          league,
          game,
          homeTeam,
          awayTeam,
          date,
          _sources,
        });

        const {
          id: matchId,
        } = await match.save();

        logger.info(`Unique match saved with ${matchId}`);
        return ParserResultTypes.Fresh;
      }

      return ParserResultTypes.Fresh;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
}

export default MatchParser;
export {
  ParserResultTypes,
};
