import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function RootLayoutNav() {
  const { loading, isAuthenticated } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
      </Stack>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Not authenticated - show login
        <Stack.Screen name="login" />
      ) : (
        // Authenticated - show app screens
        <>
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="deliveryinfo" />
          <Stack.Screen name="completed-deliveries" />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
