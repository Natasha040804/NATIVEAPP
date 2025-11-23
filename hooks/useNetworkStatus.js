import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
	const [state, setState] = useState({
		isConnected: true,
		isInternetReachable: true,
		type: 'unknown',
		details: null,
	});

	useEffect(() => {
		const unsubscribe = NetInfo.addEventListener(info => {
			setState({
				isConnected: info.isConnected,
				isInternetReachable: info.isInternetReachable,
				type: info.type,
				details: info.details || null,
			});
		});
		NetInfo.fetch().then(info => {
			setState({
				isConnected: info.isConnected,
				isInternetReachable: info.isInternetReachable,
				type: info.type,
				details: info.details || null,
			});
		});
		return () => unsubscribe();
	}, []);

	return state;
}

export function getOfflineReason(state) {
	if (!state.isConnected) return 'Device reports no network connection (Wi‑Fi / cellular).';
	if (state.isConnected && state.isInternetReachable === false) return 'Network connected but lacks internet reachability (captive portal / DNS issues).';
	return null;
}
