const redisKeys = {
  auctionCloseAt: (rfqId) => `auction:${rfqId}:closeAt`,
  auctionLock: (rfqId) => `auction:${rfqId}:lock`,
  auctionStatus: (rfqId) => `auction:${rfqId}:status`,
};

export default redisKeys;