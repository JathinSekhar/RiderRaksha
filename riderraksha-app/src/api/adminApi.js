import axios from 'axios';

const API = 'http://127.0.0.1:5000/api';

export const getAnalytics = async () => {
  try {
    const res = await axios.get(`${API}/admin/analytics`);
    return res.data;
  } catch (err) {
    console.error('[API] Analytics fetch failed:', err.message);
    return {};
  }
};

export const getAllClaims = async () => {
  try {
    const res = await axios.get(`${API}/claims/all`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error('[API] Claims fetch failed:', err.message);
    return [];
  }
};

export const getAlerts = async () => {
  try {
    const res = await axios.get(`${API}/admin/alerts`);
    return res.data.alerts || [];
  } catch (err) {
    console.error('[API] Alerts fetch failed:', err.message);
    return [];
  }
};
