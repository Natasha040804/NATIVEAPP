import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { API_BASE_URL, api } from '../lib/api';

// Initial route: redirect to login
export default function Index() {
  useEffect(() => {
    (async () => {
      console.log('[Startup] API base URL:', API_BASE_URL);
      try {
        const ok = await api.testConnection();
        console.log('[Startup] Health check:', ok);
      } catch (e) {
        console.warn('[Startup] Health check failed:', e?.message || e);
      }
    })();
  }, []);
  return <Redirect href="/login" />;
}
