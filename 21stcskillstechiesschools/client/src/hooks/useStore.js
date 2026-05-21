/**
 * useStore.js — React hook to subscribe to the in-memory store.
 * Usage: const { users, notifications, posts } = useStore();
 */
import { useState, useEffect } from 'react';
import { subscribe, getState } from '../lib/store';

const useStore = () => {
  const [state, setState] = useState(getState);
  useEffect(() => subscribe(setState), []);
  return state;
};

export default useStore;
