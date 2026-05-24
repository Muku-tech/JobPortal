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
        .replace(/ing$/, "")
        .replace(/s$/, "")
        .replace(/ed$/, "")
        .replace(/er$/, "")
        .replace(/ment$/, "")
        .replace(/es$/, "");
    })
    .filter(Boolean);
}

/**
 * Checks if two skill strings are matching based on stemmed token overlap.
 * @param {string} skillA
 * @param {string} skillB
 * @returns {boolean}
 */
function matchSkills(skillA, skillB) {
  if (!skillA || !skillB) return false;

  const tokensA = getStemmedTokens(skillA);
  const tokensB = getStemmedTokens(skillB);

  if (tokensA.length === 0 || tokensB.length === 0) return false;

  // Check if there is significant overlap between tokens
  return tokensA.some((tA) =>
    tokensB.some((tB) => tA.includes(tB) || tB.includes(tA)),
  );
}

module.exports = {
  getStemmedTokens,
  matchSkills,
};
