import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
// Signature removed per Option B
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { api } from '../lib/api';

export default function PickupVerification({ assignmentId, onVerificationComplete, onCancel }) {
  const [photo, setPhoto] = useState(null);
  const [currentStep, setCurrentStep] = useState('photo'); // 'photo', 'review'
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for verification');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({});
      return { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch (error) {
      console.error('Location error:', error);
      return null;
    }
  };

  // Signature removed

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Camera access is needed to take verification photos');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });
      if (!result.canceled) {
        // Keep the full asset (with uri, type if available)
        setPhoto(result.assets[0]);
        setCurrentStep('review');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const submitVerification = async () => {
    if (!photo) {
      Alert.alert('Incomplete', 'A photo is required');
      return;
    }
    setLoading(true);
    try {
      const currentLocation = await getCurrentLocation();
      if (!currentLocation) {
        Alert.alert('Location Error', 'Could not get current location');
        setLoading(false);
        return;
      }
      // Prefer multipart flow with Authorization bearer header
      const response = await api.verifyPickupMultipart(assignmentId, {
        file: photo && {
          uri: photo.uri,
          type: photo.mimeType || 'image/jpeg',
          name: (photo.fileName || 'pickup') + '.jpg',
        },
        location: currentLocation,
        notes: 'Pickup verified with photo',
      });
      Alert.alert('Success', 'Pickup verified successfully!');
      onVerificationComplete && onVerificationComplete(response?.status || 'IN_PROGRESS');
    } catch (error) {
      console.error('Pickup verification failed:', error);
      Alert.alert('Error', error?.message || 'Failed to verify pickup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Verify Pickup</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.progressContainer}>
          <ProgressStep step={1} currentStep={currentStep} label="Photo" />
          <ProgressStep step={2} currentStep={currentStep} label="Review" />
        </View>

        {/* Signature step removed per Option B */}

        {currentStep === 'photo' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Item Photo</Text>
            <Text style={styles.stepDescription}>
              Take a clear photo of the items being picked up
            </Text>
            {photo ? (
              <View style={styles.photoPreview}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                <TouchableOpacity style={styles.retakeButton} onPress={takePhoto}>
                  <Text style={styles.retakeText}>Retake Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                <Icon name="photo-camera" size={48} color="#6021F3" />
                <Text style={styles.photoButtonText}>Take Photo of Items</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {currentStep === 'review' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Review & Confirm</Text>
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Photo Taken:</Text>
              {photo && <Image source={{ uri: photo.uri }} style={styles.photoPreviewSmall} />}
            </View>
            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
              onPress={submitVerification}
              disabled={loading}
            >
              <Text style={styles.confirmButtonText}>{loading ? 'Submitting...' : 'Confirm'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ProgressStep({ step, currentStep, label }) {
  const steps = ['photo', 'review'];
  const isActive = currentStep === steps[step - 1];
  const isCompleted = steps.indexOf(currentStep) >= step;
  return (
    <View style={styles.progressStep}>
      <View
        style={[
          styles.progressCircle,
          isActive && styles.progressCircleActive,
          isCompleted && styles.progressCircleCompleted,
        ]}
      >
        <Text style={styles.progressText}>{isCompleted ? '✓' : step}</Text>
      </View>
      <Text style={[styles.progressLabel, isActive && styles.progressLabelActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  backButton: { padding: 8 },
  content: { flex: 1, padding: 16 },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  progressStep: { alignItems: 'center', flex: 1 },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressCircleActive: { backgroundColor: '#6021F3' },
  progressCircleCompleted: { backgroundColor: '#34A853' },
  progressText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  progressLabel: { fontSize: 12, color: '#666', textAlign: 'center' },
  progressLabelActive: { color: '#6021F3', fontWeight: '600' },
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  stepDescription: { fontSize: 14, color: '#666', marginBottom: 24 },
  signatureContainer: { height: 300, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, overflow: 'hidden' },
  // Updated/added styles for signature step UX
  captureSignatureSection: { alignItems: 'center' },
  captureSignatureButton: {
    height: 200,
    borderWidth: 2,
    borderColor: '#6021F3',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9ff',
    padding: 20,
  },
  captureSignatureText: { marginTop: 12, color: '#6021F3', fontWeight: '600', fontSize: 16 },
  captureSignatureSubtext: { marginTop: 4, color: '#666', fontSize: 12 },
  helpText: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  helpTextContent: { color: '#666', fontSize: 12, flex: 1 },
  signatureStatus: { alignItems: 'center', marginBottom: 12 },
  signatureStatusText: { marginTop: 8, fontSize: 16, fontWeight: '700', color: '#34A853' },
  signatureStatusSubtext: { color: '#666', fontSize: 12, textAlign: 'center' },
  signatureActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  changeSignatureButton: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f0f0f0', borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  changeSignatureText: { color: '#6021F3', fontWeight: '600' },
  nextButton: { backgroundColor: '#6021F3', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  nextButtonText: { color: '#fff', fontWeight: '600' },
  photoButton: {
    height: 200,
    borderWidth: 2,
    borderColor: '#6021F3',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9ff',
  },
  photoButtonText: { marginTop: 12, color: '#6021F3', fontWeight: '600' },
  photoPreview: { alignItems: 'center' },
  photoImage: { width: 200, height: 200, borderRadius: 8, marginBottom: 16 },
  retakeButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#6021F3', borderRadius: 8 },
  retakeText: { color: '#fff', fontWeight: '600' },
  reviewSection: { marginBottom: 24 },
  reviewLabel: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 8 },
  photoPreviewSmall: { width: 150, height: 150, borderRadius: 8 },
  confirmButton: { backgroundColor: '#6021F3', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
