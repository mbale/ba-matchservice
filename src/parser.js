import {
  ObjectId,
} from 'mongorito';
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
      GameComparator.findSimilar(gamename, gameCollection),
      LeagueComparator.findSimilar(leaguename, leagueCollection),
      TeamComparator.findSimilar(homeTeamname, teamCollection),
      TeamComparator.findSimilar(awayTeamname, teamCollection),
    ]);

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
      console.log('similar match');
      //console.log(`found similar match: ${debug}`);
    } else {
      const uniqueMatch = new Match({
        game: gameData,
        league: leagueData,
        homeTeam: homeTeamData,
        awayTeam: awayTeamData,
        date,
      });

      await uniqueMatch.save();
      const debug = JSON.stringify(await uniqueMatch.get(), null, 4);

      console.log('we saved new match');
      //console.log(`saved new match: ${debug}`);
    }
  } catch (error) {
    throw error;
  }
}

export default parser;
