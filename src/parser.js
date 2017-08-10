import Raven from 'raven';
// import MatchService from './comparators/match.js';
// import LeagueService from './comparators/league.js';
// import TeamService from './comparators/team.js';
import Game from './models/game.js';
import GameComparator from './comparators/game.js';

async function parser(matchData) {
  try {
    //console.log(matchData);
    const {
      homeTeam,
      awayTeam,
      league,
      game: gamename,
    } = matchData;

    let {
      date,
    } = matchData;

    date = new Date(date);

    const match = {
      date,
    };

    /*
      League
    */

    // const leagueService = new LeagueService(league);

    // const {
    //   unique: leagueUnique,
    //   id: leagueId,
    // } = await leagueService.similarityCheck({
    //   algoCheck: false,
    // });

    // if (!leagueUnique) {
    //   match.leagueId = leagueId;
    // } else {
    //   match.leagueId = await leagueService.save();
    // }

    // /*
    //   Team
    // */

    // const homeTeamService = new TeamService(homeTeam);
    // const awayTeamService = new TeamService(awayTeam);

    // const {
    //   unique: homeTeamUnique,
    //   id: homeTeamId,
    // } = await homeTeamService.similarityCheck({
    //   algoCheck: false,
    // });

    // if (!homeTeamUnique) {
    //   match.homeTeamId = homeTeamId;
    // } else {
    //   match.homeTeamId = await homeTeamService.save();
    // }

    // const {
    //   unique: awayTeamUnique,
    //   id: awayTeamId,
    // } = await awayTeamService.similarityCheck({
    //   algoCheck: false,
    // });

    // if (!awayTeamUnique) {
    //   match.awayTeamId = awayTeamId;
    // } else {
    //   match.awayTeamId = await awayTeamService.save();
    // }

    /*
      Game
    */

    const gameCollection = await Game.find();

    const {
      unique: gameUnique,
      id: gameId,
    } = await GameComparator.findSimilar(gamename, gameCollection);

    if (!gameUnique) {
      console.log(gameId)
    } else {
      const game = new Game({
        name: gamename,
      });

      await game.save();
    }

    // /*
    //   Match
    // */

    // const matchService = new MatchService(match);

    // // check if we have the same match in db

    // const similarMatch = await MatchService.model.findOne({
    //   homeTeamId: match.homeTeamId,
    //   awayTeamId: match.awayTeamId,
    //   date,
    // });

    // if (similarMatch) {
    //   // console.log(await similarMatch.get('homeTeamId'))
    //   // console.log(await similarMatch.get('awayTeamId'))
    //   console.log(`found similar match: ${await similarMatch.get('_id')}`);
    // } else {
    //   const matchId = await matchService.save();
    //   console.log(`saved new match: ${matchId}`);
    // }
  } catch (error) {
    console.log(error)
    //Raven.captureException(error);
  }
}

export default parser;
