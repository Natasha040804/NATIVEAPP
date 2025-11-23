import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Sidebar from '../components/Sidebar';
import { api } from '../lib/api';

export default function Profile() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await api.getUserProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const navigateAndClose = (path) => {
    setSidebarVisible(false);
    router.push(path);
  };

  const closeSidebar = () => {
    if (sidebarVisible) setSidebarVisible(false);
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'Admin': return 'Administrator';
      case 'Auditor': return 'Auditor';
      case 'AccountExecutive': return 'Account Executive';
      case 'Logistics': return 'Logistics Personnel';
      default: return role;
    }
  };

  const getDefaultPhoto = () => require('../assets/ronron.jpg');

  const getProfilePhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    // Build relative uploads URL via API base (best-effort; adjust if needed)
    try {
      const { API_BASE_URL } = require('../lib/api');
      // API_BASE_URL ends with /api; uploads served at /uploads
      const base = API_BASE_URL.replace(/\/api$/i, '');
      return `${base}/uploads/${photoPath}`;
    } catch {
      return photoPath;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={loadProfile}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={closeSidebar}>
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <Sidebar
          visible={sidebarVisible}
          onVisibleChange={setSidebarVisible}
          top={insets.top + 8}
          onNavigate={navigateAndClose}
        />

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.card}>
            <View style={styles.cardHeaderWrap}>
              <LinearGradient
                colors={["#6A4DF4", "#8D6CFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardHeader}
              />
              <View style={styles.avatarWrap}>
                <Image 
                  source={profile.photo ? { uri: getProfilePhotoUrl(profile.photo) } : getDefaultPhoto()} 
                  style={styles.profilePic} 
                  onError={(e) => console.log('Error loading profile photo:', e.nativeEvent?.error)}
                />
              </View>
            </View>

            <Text style={styles.name}>{profile.fullname || 'No Name'}</Text>
            <Text style={styles.companyId}>Employee ID: {profile.employeeId || 'N/A'}</Text>

            {/* Read-only details list */}
            <View style={styles.detailsList}>
              <DetailRow icon="person" label="Username" value={profile.username} />
              <DetailRow icon="email" label="Email" value={profile.email} />
              <DetailRow icon="work" label="Role" value={getRoleDisplayName(profile.role)} />
              <DetailRow icon="call" label="Contact" value={profile.contact} />
              <DetailRow icon="location-on" label="Address" value={profile.address} />
              <DetailRow icon="business" label="Branch" value={profile.branchName || `Branch ${profile.branchId}`} />
              <DetailRow icon="confirmation-number" label="Branch Code" value={profile.branchCode} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Icon name={icon} size={20} color="#6021F3" />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const PURPLE = '#6021F3';
const YELLOW = '#FFB84D';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PURPLE },
  scrollContainer: { alignItems: 'center', paddingBottom: 80, paddingTop: 92 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: PURPLE,
    fontWeight: '600',
    fontSize: 16,
  },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeaderWrap: { borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  cardHeader: { height: 110 },
  avatarWrap: { alignItems: 'center', marginTop: -40 },
  profilePic: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#eee',
  },
  name: { fontSize: 20, fontWeight: 'bold', color: '#000', textAlign: 'center', marginTop: 8 },
  companyId: { fontSize: 14, color: '#444', textAlign: 'center', marginBottom: 12 },
  detailsList: { paddingHorizontal: 16, paddingTop: 8 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F7FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 10,
  },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { color: '#333', fontWeight: '600' },
  detailValue: { color: '#000', flexShrink: 1, textAlign: 'right' },
});
