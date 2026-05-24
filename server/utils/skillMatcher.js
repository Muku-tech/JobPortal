/**
 * Utility for skill tokenization and matching.
 */

/**
 * Normalizes a skill string by converting to lowercase, removing special characters,
 * splitting into tokens, and applying a light stemming algorithm.
 * @param {string} skill
 * @returns {string[]} array of stemmed tokens
 */
function getStemmedTokens(skill) {
  if (!skill || typeof skill !== "string") return [];
  return skill
    .toLowerCase()
    .replace(/[^a-z0-9\s#\+\.]/g, "") // Keep alphanumeric, spaces, and symbols like # (C#) or + (C++)
    .split(/\s+/)
    .map((token) => {
      // Light stemming: remove common suffixes
      return token
        .replace(/ing$/i, "")
        .replace(/s$/i, "")
        .replace(/ed$/i, "")
        .replace(/er$/i, "")
        .replace(/ment$/i, "")
        .replace(/es$/i, "");
    })
    .filter(Boolean);
}

/**
 * Takes an array of skill strings and returns a Set of unique normalized tokens.
 * @param {string[]} skills
 * @returns {Set<string>}
 */
function normalizeSkillSet(skills) {
  const tokenSet = new Set();
  if (!Array.isArray(skills)) return tokenSet;
  skills.forEach((skill) => {
    getStemmedTokens(skill).forEach((t) => tokenSet.add(t));
  });
  return tokenSet;
}

/**
 * Calculates a simple match percentage between a candidate's skills and a job's required skills.
 * The score is the ratio of intersecting tokens to the total unique tokens in the required set.
 * @param {string[]} candidateSkills - list of skill strings from the candidate profile.
 * @param {string[]} requiredSkills - list of skill strings required by the job.
 * @returns {number} match percentage (0‑100)
 */
function calculateSkillMatch(candidateSkills, requiredSkills) {
  if (!Array.isArray(candidateSkills) || !Array.isArray(requiredSkills)) return 0;
  const candidateSet = normalizeSkillSet(candidateSkills);
  const requiredSet = normalizeSkillSet(requiredSkills);
  if (requiredSet.size === 0) return 0;
  let intersect = 0;
  requiredSet.forEach((tok) => {
    if (candidateSet.has(tok)) intersect++;
  });
  const score = (intersect / requiredSet.size) * 100;
  return Math.round(score);
}

module.exports = {
  getStemmedTokens,
  normalizeSkillSet,
  calculateSkillMatch,
};
