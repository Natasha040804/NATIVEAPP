import React from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import useParsedLocalSearchParams from '../lib/params';
import PickupVerification from '../components/PickupVerification';

export default function PickupVerificationScreen() {
  const params = useParsedLocalSearchParams();
  const id = params?.id || params?.assignmentId;
  const router = useRouter();

  const handleComplete = () => {
    Alert.alert('Pickup Verified', 'Status updated to In Progress.');
    router.replace({ pathname: '/taskdetails', params: { id } });
  };

  return (
    <PickupVerification
      assignmentId={id}
      onVerificationComplete={handleComplete}
      onCancel={() => router.back()}
    />
  );
}
