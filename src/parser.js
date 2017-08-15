import Match from './models/match.js';
import Game from './models/game.js';
import League from './models/league.js';
import Team from './models/team.js';
import LeagueComparator from './comparators/league.js';
import GameComparator from './comparators/game.js';
import TeamComparator from './comparators/team.js';

async function parser(matchData) {
  try {
    const {
      homeTeam: homeTeamname,
      awayTeam: awayTeamname,
      league: leaguename,
      game: gamename,
    } = matchData;

    let {
      date,
    } = matchData;

    date = new Date(date);

    const match = {
      date,
    };

    const [
      gameCollection,
      leagueCollection,
      teamCollection,
    ] = await Promise.all([
      Game.find(),
      League.find(),
      Team.find(),
    ]);

    const [{
      unique: gameUnique,
      id: gameId,
    }, {
      unique: leagueUnique,
      id: leagueId,
    }, {
      unique: homeTeamUnique,
      id: homeTeamId,
    }, {
      unique: awayTeamUnique,
      id: awayTeamId,
    }] = await Promise.all([
      GameComparator.findSimilar(gamename, gameCollection),
      LeagueComparator.findSimilar(leaguename, leagueCollection),
      TeamComparator.findSimilar(homeTeamname, teamCollection),
      TeamComparator.findSimilar(awayTeamname, teamCollection),
    ]);

    /*
      Saving unique entities
    */

    if (gameUnique) {
      const game = new Game({
        name: gamename,
      });
      const {
        id,
      } = await game.save();
      match.gameId = id;
    } else {
      match.gameId = gameId;
    }

    if (leagueUnique) {
      const league = new League({
        name: leaguename,
      });
      const {
        id,
      } = await league.save();
      match.leagueId = id;
    } else {
      match.leagueId = leagueId;
    }

    if (homeTeamUnique) {
      const homeTeam = new Team({
        name: homeTeamname,
      });
      const {
        id,
      } = await homeTeam.save();
      match.homeTeamId = id;
    } else {
      match.homeTeamId = homeTeamId;
    }

    if (awayTeamUnique) {
      const awayTeam = new Team({
        name: awayTeamname,
      });
      const {
        id,
      } = await awayTeam.save();
      match.awayTeamId = id;
    } else {
      match.awayTeamId = awayTeamId;
    }

    /*
      Comparing match
    */

    const similarMatch = await Match.findOne(match);

    if (similarMatch) {
      console.log(`found similar match: ${await similarMatch.get('_id')}`);
    } else {
      const uniqueMatch = new Match(match);
      const {
        id: matchId,
      } = await uniqueMatch.save();
      console.log(`saved new match: ${matchId}`);
    }
  } catch (error) {
    console.log(error)
  }
}

export default parser;
