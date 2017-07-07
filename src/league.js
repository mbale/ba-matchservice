import {
  Model,
} from 'mongorito';
import {
  similarity,
} from 'talisman/metrics/distance/dice';

function calculateSimilarity(from, to, threshold = 0.85) {
  const value = similarity(from, to); // calculate value of similarity
  const isSimilar = value >= threshold; // is it between range?
  console.log('-= Calculating similarity =-');
  console.log(`entity_from: ${from}`);
  console.log(`entity_to: ${to}`);
  console.log(`threshold: ${threshold}`);
  console.log(`index: ${value}`);
  console.log(`related: ${isSimilar}`);
  return {
    isSimilar,
    value,
  };
}

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

  // we automatically store when we've empty db
  if (leagues.length === 0) {
    const {
      id: savedLeagueId,
    } = await new League({
      name: leaguenameToCheck,
    }).save();
    // save ref
    leagueId = savedLeagueId;
  }

  // take it as true by default
  let isLeagueUnique = true;
  const relatedLeague = {
    data: null,
    value: null,
  };

  // we check for similar entities and save if it's really unique
  for (const league of leagues) { // eslint-disable-line
    const {
      name: leaguenameInDB,
    } = await league.get(); // eslint-disable-line

    // get collision results
    const {
      isSimilar,
      value,
    } = calculateSimilarity(leaguenameInDB, leaguenameToCheck, 0.85);

    // we first check if it's strictly equal and if not, then we set league as not unique
    // we need this check because in second check
    // there could be case when it's similar but not strictly equal
    if (leaguenameToCheck === leaguenameInDB) {
      relatedLeague.data = await league.get(); // eslint-disable-line
      relatedLeague.value = value; // store how like it's similar
      leagueId = await league.get('_id'); // eslint-disable-line
      isLeagueUnique = false;
    }

    // store as similar in unique one when it's not strictly equal
    if (isSimilar && leaguenameToCheck !== leaguenameInDB) {
      if (relatedLeague.value < value) {
        relatedLeague.data = await league.get(); // eslint-disable-line
        relatedLeague.value = value;
        leagueId = await league.get('_id'); // eslint-disable-line
        // store as similar
        isLeagueUnique = false;
      }
      // we save it anyway
      await league.addSimilar(leaguenameToCheck, value); // eslint-disable-line
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
