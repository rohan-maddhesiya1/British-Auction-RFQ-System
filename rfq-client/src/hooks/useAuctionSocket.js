import { useEffect, useMemo, useReducer } from 'react';
import { SocketContext } from '../context/SocketContext';
import { useContext } from 'react';

const normalizeBids = (bids = []) =>
  [...bids]
    .sort((a, b) => Number(a.totalAmount ?? 0) - Number(b.totalAmount ?? 0))
    .map((bid, index) => ({ ...bid, rank: bid.rank ?? index + 1 }));

const mergeRankings = (currentBids, payload = {}) => {
  const rankings = payload.rankings ?? payload.rankedBids ?? payload.bids;
  if (!Array.isArray(rankings)) return normalizeBids(currentBids);

  const byBidId = new Map(
    currentBids.map((bid) => [String(bid._id ?? bid.bidId), bid]),
  );

  if (payload.bid?._id) {
    byBidId.set(String(payload.bid._id), payload.bid);
  }

  return normalizeBids(
    rankings.map((ranking) => {
      const bidId = String(ranking.bidId ?? ranking._id);
      const existing = byBidId.get(bidId) ?? {};
      return {
        ...existing,
        ...ranking,
        _id: existing._id ?? ranking._id ?? ranking.bidId,
      };
    }),
  );
};

const initialState = {
  rfq: null,
  config: null,
  bids: [],
  closeAt: null,
  log: [],
  status: 'draft',
};

const appendLog = (log, entry) => {
  if (!entry) return log;
  return [entry, ...log].slice(0, 120);
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'hydrate': {
      const payload = action.payload ?? {};
      return {
        ...state,
        rfq: payload.rfq ?? state.rfq,
        config: payload.config ?? state.config,
        bids: normalizeBids(payload.bids ?? state.bids),
        closeAt: payload.config?.currentCloseAt ?? payload.rfq?.currentCloseAt ?? payload.rfq?.bidCloseAt ?? state.closeAt,
        log: payload.log ?? state.log,
        status: payload.rfq?.status ?? state.status,
      };
    }
    case 'new_bid':
      return {
        ...state,
        bids: mergeRankings(state.bids, action.payload),
        log: appendLog(state.log, {
          eventType: 'BID_SUBMITTED',
          timestamp: new Date().toISOString(),
          bid: action.payload?.bid,
          reason: action.payload?.reason,
        }),
      };
    case 'time_extended':
      return {
        ...state,
        closeAt: action.payload?.currentCloseAt ?? action.payload?.newCloseAt ?? state.closeAt,
        config: state.config
          ? {
              ...state.config,
              currentCloseAt: action.payload?.currentCloseAt ?? action.payload?.newCloseAt ?? state.config.currentCloseAt,
              extensionCount: action.payload?.extensionCount ?? state.config.extensionCount,
            }
          : state.config,
        log: appendLog(state.log, {
          eventType: 'AUCTION_EXTENDED',
          timestamp: new Date().toISOString(),
          reason: action.payload?.reason,
          extensionDurationMins: action.payload?.extensionDurationMins,
          newCloseAt: action.payload?.currentCloseAt ?? action.payload?.newCloseAt,
        }),
      };
    case 'auction_closed':
      return {
        ...state,
        status: action.payload?.status ?? (action.payload?.reason === 'forced_close' ? 'force_closed' : 'closed'),
        log: appendLog(state.log, {
          eventType: action.payload?.status === 'force_closed' || action.payload?.reason === 'forced_close' ? 'FORCE_CLOSED' : 'AUCTION_CLOSED',
          timestamp: new Date().toISOString(),
          reason: action.payload?.reason,
        }),
      };
    default:
      return state;
  }
};

export const useAuctionSocket = (rfqId, initialData) => {
  const { socket } = useContext(SocketContext);
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: 'hydrate', payload: initialData });
  }, [initialData]);

  useEffect(() => {
    if (!socket || !rfqId) return undefined;

    socket.emit('join_auction', { rfqId });
    const onNewBid = (payload) => dispatch({ type: 'new_bid', payload });
    const onTimeExtended = (payload) => dispatch({ type: 'time_extended', payload });
    const onAuctionClosed = (payload) => dispatch({ type: 'auction_closed', payload });

    socket.on('new_bid', onNewBid);
    socket.on('time_extended', onTimeExtended);
    socket.on('auction_closed', onAuctionClosed);

    return () => {
      socket.emit('leave_auction', { rfqId });
      socket.off('new_bid', onNewBid);
      socket.off('time_extended', onTimeExtended);
      socket.off('auction_closed', onAuctionClosed);
    };
  }, [rfqId, socket]);

  return useMemo(() => state, [state]);
};
