import api from './api';

export const listRfqs = async () => {
  const { data } = await api.get('/rfqs');
  return data.rfqs ?? [];
};

export const getRfq = async (rfqId) => {
  const { data } = await api.get(`/rfqs/${rfqId}`);
  return data;
};

export const createRfq = async (payload) => {
  const { data } = await api.post('/rfqs', payload);
  return data.rfq;
};

export const activateRfq = async (rfqId) => {
  const { data } = await api.patch(`/rfqs/${rfqId}/activate`);
  return data;
};

export const listAuctions = async () => {
  const { data } = await api.get('/auctions');
  return data.auctions ?? data.rfqs ?? [];
};

export const getAuction = async (rfqId) => {
  const { data } = await api.get(`/auctions/${rfqId}`);
  return data;
};

export const getActivityLog = async (rfqId, page = 1) => {
  const { data } = await api.get(`/auctions/${rfqId}/log`, { params: { page } });
  return data;
};
