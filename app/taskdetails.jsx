import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import useParsedLocalSearchParams from '../lib/params';
import Sidebar from '../components/Sidebar';
import { api, diagnoseConnectivity, API_BASE_URL } from '../lib/api';
import { useNetworkStatus, getOfflineReason } from '../hooks/useNetworkStatus';
import { useLocationTracking } from '../hooks/useLocationTracking';

export default function TaskDetails() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [netDiag, setNetDiag] = useState(null);
  const [assignError, setAssignError] = useState(null);
  const { id } = useParsedLocalSearchParams();
  const netStatus = useNetworkStatus();
  const offlineReason = getOfflineReason(netStatus);

  // Start location tracking when this task is active
  const trackingActive = useMemo(() => {
    const s = String(assignment?.status || '').toUpperCase();
    return s === 'ASSIGNED' || s === 'IN_PROGRESS';
  }, [assignment]);
  const { isTracking, locationError } = useLocationTracking(id, trackingActive);

  useEffect(() => {
    loadAssignmentDetails();
  }, [id]);

  const loadAssignmentDetails = async () => {
    try {
      const assignmentData = await api.getDeliveryAssignment(id);
      setAssignment(assignmentData);
      setAssignError(null);
    } catch (error) {
      console.error('Failed to load assignment details:', error);
      setAssignError(error?.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  // Run network diagnostics if assignment fails or on initial mount
  useEffect(() => {
    if (!netDiag) {
      (async () => {
        try {
          const diag = await diagnoseConnectivity();
          setNetDiag(diag);
        } catch (e) {
          setNetDiag({ base: API_BASE_URL, results: [{ url: 'diagnostic', ok: false, error: e?.message || String(e) }] });
        }
      })();
    }
  }, [netDiag]);

  const updateStatus = async (newStatus) => {
    try {
      await api.updateDeliveryStatus(id, newStatus);
      Alert.alert('Success', `Status updated to ${String(newStatus || '').replace(/_/g, ' ')}`);
      loadAssignmentDetails(); // Refresh data
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return '#34A853';
      case 'IN_PROGRESS': return '#FBBC05';
      case 'ASSIGNED': return '#4285F4';
      case 'PENDING': return '#EA4335';
      case 'CANCELLED': return '#666';
      default: return '#999';
    }
  };

  const getAssignmentTypeLabel = (type) => {
    switch (type) {
      case 'ITEM_TRANSFER': return 'Item Transfer';
      case 'CAPITAL_DELIVERY': return 'Capital Delivery';
      case 'BALANCE_DELIVERY': return 'Balance Delivery';
      default: return type;
    }
  };

  const getLocationTypeLabel = (type) => {
    return type === 'BRANCH' ? 'Branch' : 'Office';
  };

  const openDirections = () => {
    if (!assignment) return;
    const fromLat = assignment.from_branch_lat;
    const fromLng = assignment.from_branch_lng;
    const toLat = assignment.to_branch_lat;
    const toLng = assignment.to_branch_lng;

    // Prefer lat/lng; fallback to branch names/addresses
    let origin;
    let destination;
    if (fromLat != null && fromLng != null) {
      origin = `${fromLat},${fromLng}`;
    } else if (assignment.from_branch_address) {
      origin = encodeURIComponent(assignment.from_branch_address);
    } else if (assignment.from_branch_name) {
      origin = encodeURIComponent(assignment.from_branch_name);
    }
    if (toLat != null && toLng != null) {
      destination = `${toLat},${toLng}`;
    } else if (assignment.to_branch_address) {
      destination = encodeURIComponent(assignment.to_branch_address);
    } else if (assignment.to_branch_name) {
      destination = encodeURIComponent(assignment.to_branch_name);
    }

    if (!origin || !destination) {
      Alert.alert('Directions Unavailable', 'Missing branch coordinates or addresses.');
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Failed to open Google Maps');
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading assignment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!assignment) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Assignment not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <Sidebar visible={sidebarVisible} onVisibleChange={setSidebarVisible} top={insets.top + 8} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>
            Assignment #{assignment.assignment_id}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.card}>
          {offlineReason && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineTitle}>Offline Detected</Text>
              <Text style={styles.offlineText}>{offlineReason}</Text>
              <Text style={styles.offlineHint}>Checks:
              {'\n'}• Enable Wi‑Fi or cellular data
              {'\n'}• Disable airplane mode / VPN
              {'\n'}• Open a website to confirm internet
              {'\n'}• If captive portal, complete login</Text>
            </View>
          )}
          {assignError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerTitle}>Connection / Data Error</Text>
              <Text style={styles.errorBannerText}>{assignError}</Text>
              {netDiag && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.errorBannerSub}>Diagnostics (base: {netDiag.base}):</Text>
                  {netDiag.results.map((r, i) => (
                    <Text key={i} style={styles.errorBannerLine}>
                      {r.ok ? '✅' : '❌'} {r.url} {r.status ? `(status ${r.status})` : ''} {r.ms != null ? `${r.ms}ms` : ''} {r.error ? '- ' + r.error : ''}
                    </Text>
                  ))}
                  {netDiag.external && (
                    <Text style={styles.errorBannerLine}>
                      {netDiag.external.ok ? '✅' : '❌'} External reachability {netDiag.external.status ? `(status ${netDiag.external.status})` : ''} {netDiag.external.ms != null ? `${netDiag.external.ms}ms` : ''} {netDiag.external.error ? '- ' + netDiag.external.error : ''}
                    </Text>
                  )}
                  {netDiag.classification && (
                    <View style={{ marginTop: 6 }}>
                      <Text style={styles.errorBannerSub}>Classification: {netDiag.classification.code}</Text>
                      {netDiag.classification.suggestions.map((s, idx) => (
                        <Text key={idx} style={styles.errorBannerLine}>• {s}</Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
              <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadAssignmentDetails(); }}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.sectionTitle}>Assignment Information</Text>
          {/* Lightweight indicator for tracking state */}
          {trackingActive && (
            <Text style={styles.trackingPill}>
              {isTracking ? '📡 Tracking driver location' : '⏳ Starting location tracking...'}
              {locationError ? ` – ${locationError}` : ''}
            </Text>
          )}
          
          <DetailRow label="Type" value={getAssignmentTypeLabel(assignment.assignment_type)} />
          <DetailRow label="Status" value={String(assignment?.status || '').replace(/_/g, ' ')} />
          <DetailRow label="Assigned By" value={assignment.assigned_by_name} />
          <DetailRow label="Due Date" value={formatDateTime(assignment.due_date)} />
          
          {assignment.amount && (
            <DetailRow 
              label="Amount" 
              value={`₱${parseFloat(assignment.amount).toLocaleString()}`} 
            />
          )}

          <Text style={styles.sectionTitle}>Route Information</Text>
          
          <View style={styles.locationSection}>
            <View style={styles.locationRow}>
              <Icon name="location-on" size={16} color="#6021F3" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>
                  From {getLocationTypeLabel(assignment.from_location_type)}
                </Text>
                <Text style={styles.locationValue}>
                  {assignment.from_branch_name || 'Office'}
                </Text>
                {assignment.from_branch_address && (
                  <Text style={styles.locationAddress}>
                    {assignment.from_branch_address}
                  </Text>
                )}
                {assignment.from_branch_contact && (
                  <Text style={styles.locationContact}>
                    {assignment.from_branch_contact}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.connector}>
              <Icon name="arrow-downward" size={20} color="#6021F3" />
            </View>

            <View style={styles.locationRow}>
              <Icon name="location-on" size={16} color="#34A853" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>
                  To {getLocationTypeLabel(assignment.to_location_type)}
                </Text>
                <Text style={styles.locationValue}>
                  {assignment.to_branch_name || 'Office'}
                </Text>
                {assignment.to_branch_address && (
                  <Text style={styles.locationAddress}>
                    {assignment.to_branch_address}
                  </Text>
                )}
                {assignment.to_branch_contact && (
                  <Text style={styles.locationContact}>
                    {assignment.to_branch_contact}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {assignment.items && assignment.items.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Items</Text>
              <View style={styles.itemsContainer}>
                {assignment.items.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.name || `Item ${index + 1}`}</Text>
                    <Text style={styles.itemQuantity}>Qty: {item.quantity || 1}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {assignment.notes && (
            <>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{assignment.notes}</Text>
            </>
          )}

          <Text style={styles.sectionTitle}>Timeline</Text>
          <DetailRow label="Created" value={formatDateTime(assignment.created_at)} />
          <DetailRow label="Last Updated" value={formatDateTime(assignment.updated_at)} />
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.statusButtons}>
            {assignment.status === 'ASSIGNED' && (
              <TouchableOpacity 
                style={[styles.statusButton, styles.inProgressButton]}
                onPress={() => router.push({ pathname: '/pickup-verification', params: { id } })}
              >
                <Text style={styles.statusButtonText}>Verify Pickup</Text>
              </TouchableOpacity>
            )}

            {assignment.status === 'IN_PROGRESS' && (
              <TouchableOpacity 
                style={[styles.statusButton, styles.completeButton]}
                onPress={() => router.push({ pathname: '/dropoff-verification', params: { id } })}
              >
                <Text style={styles.statusButtonText}>Complete Delivery</Text>
              </TouchableOpacity>
            )}

            {(assignment.status !== 'ASSIGNED' && assignment.status !== 'IN_PROGRESS') && (
              <View style={{ paddingVertical: 8 }}>
                <Text style={{ color: '#666', textAlign: 'center' }}>No available actions for current status</Text>
              </View>
            )}
          </View>
        </View>

        {/* Map Section */}
        <Text style={styles.sectionTitle}>Route Map</Text>
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapInner}>
            <Icon name="map" size={28} color="#6021F3" />
            <Text style={styles.mapText}>Transfer Route Map</Text>
            <Text style={styles.mapSubtext}>
              {assignment.from_branch_name} to {assignment.to_branch_name}
            </Text>
            <TouchableOpacity style={styles.directionsBtn} onPress={openDirections}>
              <Icon name="directions" size={18} color="#fff" />
              <Text style={styles.directionsText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper component for detail rows
function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || 'N/A'}</Text>
    </View>
  );
}

const PURPLE = '#6021F3';
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PURPLE },
  content: { paddingTop: 92, paddingHorizontal: 16, paddingBottom: 24 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: PURPLE,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#fff',
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: '#fff4f4',
    borderColor: '#dc2626',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorBannerTitle: {
    color: '#b91c1c',
    fontWeight: '700',
    marginBottom: 4,
  },
  errorBannerText: {
    color: '#991b1b',
    fontSize: 12,
  },
  errorBannerSub: {
    color: '#7f1d1d',
    fontSize: 11,
    marginBottom: 2,
    fontWeight: '600',
  },
  errorBannerLine: {
    fontSize: 11,
    color: '#7f1d1d',
  },
  offlineBanner: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  offlineTitle: {
    color: '#0369a1',
    fontWeight: '700',
    marginBottom: 4,
  },
  offlineText: {
    color: '#075985',
    fontSize: 12,
    marginBottom: 6,
  },
  offlineHint: {
    color: '#0c4a6e',
    fontSize: 11,
    lineHeight: 15,
  },
  retryBtn: {
    marginTop: 10,
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingVertical: 4,
  },
  label: {
    color: '#666',
    fontWeight: '600',
    flex: 1,
  },
  value: {
    color: '#000',
    flex: 1,
    textAlign: 'right',
  },
  locationSection: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  locationValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    marginTop: 2,
  },
  locationAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  locationContact: {
    fontSize: 12,
    color: '#6021F3',
    marginTop: 2,
  },
  connector: {
    alignItems: 'center',
    marginVertical: 4,
    marginLeft: 6,
  },
  itemsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  itemName: {
    color: '#000',
    fontWeight: '500',
  },
  itemQuantity: {
    color: '#666',
    fontSize: 12,
  },
  notesText: {
    color: '#000',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  actionSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statusButtons: {
    gap: 8,
  },
  statusButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  inProgressButton: {
    backgroundColor: '#FBBC05',
  },
  completeButton: {
    backgroundColor: '#34A853',
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  mapPlaceholder: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapInner: {
    alignItems: 'center',
    gap: 8,
  },
  mapText: {
    color: '#000',
    fontWeight: '600',
  },
  mapSubtext: {
    color: '#666',
    textAlign: 'center',
    fontSize: 12,
    maxWidth: '80%',
  },
  trackingPill: {
    backgroundColor: '#eef2ff',
    color: '#1e40af',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PURPLE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  directionsText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
