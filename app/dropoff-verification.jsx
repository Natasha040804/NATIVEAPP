import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import useParsedLocalSearchParams from '../lib/params';
import Icon from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location'
import { api } from '../lib/api';

export default function DropoffVerificationScreen() {
  const { id } = useParsedLocalSearchParams();
  const router = useRouter();
  const [photo, setPhoto] = useState(null); // store full asset with uri/type/name
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
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
        // Keep the full asset so we have a valid file URI for multipart upload
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const submitVerification = async () => {
    if (!recipient.trim()) {
      Alert.alert('Missing info', 'Please enter the recipient name');
      return;
    }
    if (!photo) {
      Alert.alert('Incomplete', 'Photo is required');
      return;
    }
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      if (!location) {
        Alert.alert('Location Error', 'Could not get current location');
        setLoading(false);
        return;
      }
      await api.verifyDropoffMultipart(id, {
        file: photo && {
          uri: photo.uri,
          type: photo.mimeType || 'image/jpeg',
          name: (photo.fileName || 'dropoff') + '.jpg',
        },
        recipientName: recipient,
        location,
        notes: notes || 'Dropoff verified',
      });
      Alert.alert('Success', 'Delivery completed successfully!');
      router.replace({ pathname: '/taskdetails', params: { id } });
    } catch (error) {
      console.error('Dropoff verification failed:', error);
      Alert.alert('Error', error?.message || 'Failed to verify dropoff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Complete Delivery</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Recipient</Text>
        <TextInput
          style={styles.input}
          placeholder="Recipient name"
          placeholderTextColor="#999"
          value={recipient}
          onChangeText={setRecipient}
        />

        <Text style={styles.sectionTitle}>Delivery Photo</Text>
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
            <Text style={styles.photoButtonText}>Take Photo</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Notes"
          placeholderTextColor="#999"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
          onPress={submitVerification}
          disabled={loading}
        >
          <Text style={styles.confirmButtonText}>{loading ? 'Submitting...' : 'Confirm'}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginVertical: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    color: '#000',
    backgroundColor: '#fff',
  },
  notesInput: { height: 100, textAlignVertical: 'top' },
  // signature removed
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
  confirmButton: { backgroundColor: '#34A853', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
