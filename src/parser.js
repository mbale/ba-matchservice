import Match from './models/match.js';
import Game from './models/game.js';
import League from './models/league.js';
import Team from './models/team.js';
import LeagueComparator from './comparators/league.js';
import GameComparator from './comparators/game.js';
import TeamComparator from './comparators/team.js';

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
        return {
          type: 2,
        };
      }

      date = new Date(date);

      const [
        gameCollection,
        leagueCollection,
        teamCollection,
      ] = await Promise.all([
        Game.find(),
        League.find(),
        Team.find(),
      ]);


      let [
        game,
        league,
        homeTeam,
        awayTeam,
      ] = await Promise.all([
        GameComparator.findSimilar(gamename, gameCollection, gameComparatorOpts),
        LeagueComparator.findSimilar(leaguename, leagueCollection, leagueComparatorOpts),
        TeamComparator.findSimilar(homeTeamname, teamCollection, homeTeamComparatorOpts),
        TeamComparator.findSimilar(awayTeamname, teamCollection, awayTeamComparatorOpts),
      ]);

      if (debugMode) {
        const andQuery = {};

        if (game) {
          andQuery.game = await game.get('_id');
        }

        if (league) {
          andQuery.league = await league.get('_id');
        }

        if (homeTeam) {
          andQuery.homeTeam = await homeTeam.get('_id');
        }

        if (awayTeam) {
          andQuery.awayTeam = await awayTeam.get('_id');
        }

        const similarMatch = await Match.findOne(andQuery);
      }

      /*
        Saving unique entities
      */

      const entitiesToSave = [];

      if (!game) {
        game = new Game({
          name: gamename,
        });
        entitiesToSave.push(game.save());
      }

      if (!league) {
        league = new League({
          name: leaguename,
        });
        entitiesToSave.push(league.save());
      }

      if (!homeTeam) {
        homeTeam = new Team({
          name: homeTeamname,
        });
        entitiesToSave.push(homeTeam.save());
      }

      if (!awayTeam) {
        awayTeam = new Team({
          name: awayTeamname,
        });
        entitiesToSave.push(awayTeam.save());
      }

      await Promise.all(entitiesToSave);

      /*
        Match populating for find similar
      */

      const [
        gameData,
        leagueData,
        homeTeamData,
        awayTeamData,
      ] = await Promise.all([
        game.get(),
        league.get(),
        homeTeam.get(),
        awayTeam.get(),
      ]);

      const match = {
        'homeTeam._id': homeTeamData._id,
        'awayTeam._id': awayTeamData._id,
        date,
      };

      /*
        Query matches
      */

      const matchCollision = await Match.findOne(match);

      if (matchCollision) {
        const debug = JSON.stringify(await matchCollision.get(), null, 4);
        console.log(`found similar match: ${debug}`);

        return {
          type: 0,
        };
      }

      const uniqueMatch = new Match({
        game: gameData,
        league: leagueData,
        homeTeam: homeTeamData,
        awayTeam: awayTeamData,
        date,
      });

      await uniqueMatch.save();
      const debug = JSON.stringify(await uniqueMatch.get(), null, 4);

      console.log(`saved new match: ${debug}`);

      return {
        type: 1,
      };
    } catch (error) {
      throw error;
    }
  }
}

export default MatchParser;
