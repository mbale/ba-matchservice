import {
  similarity,
} from 'talisman/metrics/distance/dice';
import {
  isSimilar,
} from 'talisman/metrics/distance/eudex';
import jaroWinkler from 'talisman/metrics/distance/jaro-winkler';
import mra from 'talisman/metrics/distance/mra';
import levenshtein from 'talisman/metrics/distance/levenshtein';

function similarityCalculation(from, to) {
  // const eudexValue = isSimilar(from, to); // similar 
  const diceValue = similarity(from, to); // similar
  const mraValue = mra(from, to); // similar
  const jaroWinklerValue = jaroWinkler(from, to); // distance
  const levenshteinValue = levenshtein(from, to) // metric distance
  console.log('-= Calculating similarity =-');
  console.log(`entity_from: ${from}`);
  console.log(`entity_to: ${to}`);
  // console.log(`eudex: ${eudexValue}`);
  console.log(`dice: ${diceValue}`);
  console.log(`mra: match: ${mraValue.matching}, value: ${mraValue.similarity}`);
  console.log(`jarowWinkler: ${jaroWinklerValue}`);
  console.log(`levenshtein: ${levenshteinValue}`)
  return {
    // eudex: eudexValue,
    dice: diceValue,
    mra: mraValue,
    jaroWinkler: jaroWinklerValue,
    levenshtein: wlevenshteinValue,
  };
}

export default similarityCalculation;
