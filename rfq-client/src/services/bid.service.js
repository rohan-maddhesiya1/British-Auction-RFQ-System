import api from './api';

export const submitBid = async (payload) => {
  const { data } = await api.post('/bids', payload);
  return data.bid;
};

export const getBidsForRfq = async (rfqId) => {
  const { data } = await api.get(`/bids/${rfqId}`);
  return data.bids ?? [];
};
