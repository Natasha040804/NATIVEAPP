import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { api } from '../lib/api';

const LOCATION_TASK_NAME = 'background-location-task';

export const useLocationTracking = (assignmentId, isActive = false) => {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const locationIntervalRef = useRef(null);

  const requestPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        return false;
      }

      if (Platform.OS === 'ios') {
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus !== 'granted') {
          setLocationError('Background location permission is required for tracking');
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error('Error requesting location permissions:', e);
      setLocationError('Failed to request location permissions');
      return false;
    }
  };

  const sendLocationToServer = async (coords) => {
    if (!assignmentId || !coords) return;
    try {
      await api.updateDeliveryLocation(assignmentId, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        heading: coords.heading,
        speed: coords.speed,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Error sending location to server:', e);
    }
  };

  const startTracking = async () => {
    try {
      const permitted = await requestPermissions();
      if (!permitted) return;

      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      setLocation(initialLocation.coords);
      await sendLocationToServer(initialLocation.coords);

      if (Platform.OS === 'android') {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 50,
          timeInterval: 30000,
          foregroundService: {
            notificationTitle: 'Delivery Tracking',
            notificationBody: 'Tracking your delivery route in progress',
          },
        });
      } else {
        locationIntervalRef.current = setInterval(async () => {
          try {
            const currentLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.BestForNavigation,
            });
            setLocation(currentLocation.coords);
            await sendLocationToServer(currentLocation.coords);
          } catch (e) {
            console.error('Interval location error:', e);
          }
        }, 30000);
      }

      setIsTracking(true);
    } catch (e) {
      console.error('Error starting location tracking:', e);
      setLocationError('Failed to start location tracking');
    }
  };

  const stopTracking = async () => {
    try {
      if (Platform.OS === 'android') {
        const hasTask = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
        if (hasTask) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      } else if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      setIsTracking(false);
    } catch (e) {
      console.error('Error stopping location tracking:', e);
    }
  };

  useEffect(() => {
    if (isActive && assignmentId) {
      startTracking();
    } else {
      stopTracking();
    }
    return () => {
      stopTracking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, assignmentId]);

  return { location, locationError, isTracking, startTracking, stopTracking };
};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const loc = locations?.[0];
    if (loc?.coords) {
      console.log('Background location update:', loc.coords);
      // Optionally: Persist last coords to AsyncStorage for pickup by a foreground screen
    }
  }
});
