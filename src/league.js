import {
  Model,
} from 'mongorito';
import similarityCalculation from '~/similarity-calculation';

class League extends Model {
  static collection() {
    return 'leagues';
  }
}

League.prototype.addSimilar = async function addSimilar(keyword, threshold) {
  try {
    if (!keyword || typeof keyword !== 'string') {
      throw new Error(keyword);
    }

    if (!threshold || typeof threshold !== 'number') {
      throw new Error(threshold);
    }

    const similarKeywords = await this.get('keywords.similar') || [];

    // check for duplication
    const isDupe = similarKeywords.find(similar => similar.keyword === keyword);

    if (!isDupe) {
      similarKeywords.push({
        keyword,
        threshold,
      });

      this.set('keywords.similar', similarKeywords);
      await this.save();
    }
  } catch (error) {
    throw error;
  }
};

async function LeagueService(leaguenameToFind = null) {
  // get all leagues
  const leagues = await League.find();

  // store leaguename to check
  const leaguenameToCheck = leaguenameToFind;

  // store saved or queried leagueid
  let leagueId = null;
  // take it as true by default
  let isLeagueUnique = true;
  const relatedLeague = {
    data: null,
    value: null,
  };

  // we automatically store when we've empty db
  if (leagues.length === 0) {
    const {
      id: savedLeagueId,
    } = await new League({
      name: leaguenameToCheck,
    }).save();
    // save ref
    leagueId = savedLeagueId;
    return {
      leagueId,
      isLeagueUnique,
    };
  }

  // we check for similar entities and save if it's really unique
  for (const league of leagues) { // eslint-disable-line
    const {
      name: leaguenameInDB,
    } = await league.get(); // eslint-disable-line

    // get collision results
    const {
      eudex: eudexValue, // boolean
      dice: diceValue, // int
      mra: mraValue, // obj = minimum (int), similarity (int), codex (array), matching (boolean)
      jaroWinkler: jaroWinklerValue, // int
      levenshtein: levenshteinValue,
    } = similarityCalculation(leaguenameInDB, leaguenameToCheck);

    // we first check if it's strictly equal and if not, then we set league as not unique
    // we need this check because in second check
    // there could be case when it's similar but not strictly equal
    if (leaguenameToCheck === leaguenameInDB) {
      relatedLeague.data = await league.get(); // eslint-disable-line
      leagueId = await league.get('_id'); // eslint-disable-line
      isLeagueUnique = false;
    }

    if (leaguenameToCheck !== leaguenameInDB) {
      if (jaroWinklerValue >= 0.8 && diceValue >= 0.7 && levenshteinValue >= 2) {
        relatedLeague.data = await league.get(); // eslint-disable-line
        leagueId = await league.get('_id'); // eslint-disable-line
        // store as similar
        isLeagueUnique = false;
      }
    }
  }

  // store it as unique
  if (isLeagueUnique) {
    const {
      id: savedLeagueId,
    } = await new League({
      name: leaguenameToCheck,
    }).save();
    leagueId = savedLeagueId;
  }
  return {
    leagueId,
    isLeagueUnique,
  };
}

export {
  LeagueService,
  League,
};
