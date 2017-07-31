import {
  Model,
} from 'mongorito';

class Team extends Model {
  static collection() {
    return 'teams';
  }
}

Team.prototype.addSimilar = async function addSimilar(keyword, threshold) {
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

async function TeamService(teamnameToFind = null) {
  // get all teams
  const teams = await Team.find();

  // store teamname to check
  const teamnameToCheck = teamnameToFind;

  // store saved or queried teamid
  let teamId = null;

  // we automatically store when we've empty db
  if (teams.length === 0) {
    const {
      id: savedTeamId,
    } = await new Team({
      name: teamnameToCheck,
    }).save();
    // save ref
    teamId = savedTeamId;
  }

  // take it as true by default
  let isTeamUnique = true;
  const relatedTeam = {
    data: null,
    value: null,
  };

  // we check for similar entities and save if it's really unique
  for (const team of teams) { // eslint-disable-line
    const {
      name: teamnameInDB,
    } = await team.get(); // eslint-disable-line

    // get collision results
    const {
      isSimilar,
      value,
    } = calculateSimilarity(teamnameInDB, teamnameToCheck, 0.85);

    // we first check if it's strictly equal and if not, then we set team as not unique
    // we need this check because in second check
    // there could be case when it's similar but not strictly equal
    if (teamnameToCheck === teamnameInDB) {
      relatedTeam.data = await team.get(); // eslint-disable-line
      relatedTeam.value = value; // store how like it's similar
      teamId = await team.get('_id'); // eslint-disable-line
      isTeamUnique = false;
    }

    // store as similar in unique one when it's not strictly equal
    if (isSimilar && teamnameToCheck !== teamnameInDB) {
      if (relatedTeam.value < value) {
        relatedTeam.data = await team.get(); // eslint-disable-line
        relatedTeam.value = value;
        teamId = await team.get('_id'); // eslint-disable-line
        // store as similar
        isTeamUnique = false;
      }
      // we save it anyway
      await team.addSimilar(teamnameToCheck, value); // eslint-disable-line
    }
  }

  // store it as unique
  if (isTeamUnique) {
    const {
      id: savedTeamId,
    } = await new Team({
      name: teamnameToCheck,
    }).save();
    teamId = savedTeamId;
  }
  return {
    teamId,
    isTeamUnique,
  };
}

export {
  TeamService,
  Team,
};
