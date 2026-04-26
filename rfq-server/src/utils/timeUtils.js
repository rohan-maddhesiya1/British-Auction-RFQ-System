/**
 * All time operations use server Date.now().
 * Never accept timestamps from client requests.
 */

/**
 * Check if a given timestamp falls within the trigger window
 * (i.e. between [closeAt - windowMins, closeAt])
 */
export const isWithinTriggerWindow = (receivedAt, closeAt, windowMins) => {
  const windowStart = closeAt - windowMins * 60 * 1000;
  return receivedAt >= windowStart && receivedAt <= closeAt;
};

/**
 * Compute new close time after extension, capped at forcedCloseAt.
 * Returns null if there's no room to extend.
 */
export const computeNewCloseAt = (currentCloseAt, extensionMins, forcedCloseAt) => {
  const extended = currentCloseAt + extensionMins * 60 * 1000;
  const capped = Math.min(extended, forcedCloseAt);
  // No extension possible if already at or past forced close
  return capped > currentCloseAt ? capped : null;
};

/**
 * Check if auction is currently open based on server time
 */
export const isAuctionOpen = (currentCloseAt, forcedCloseAt) => {
  const now = Date.now();
  return now < currentCloseAt && now < forcedCloseAt;
};