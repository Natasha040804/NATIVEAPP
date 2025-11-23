import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import Icon from '@expo/vector-icons/MaterialIcons';
import { api } from '../lib/api';

export default function DeliveryInfo() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userName, userId } = useAuth();

  useEffect(() => {
    loadMyAssignments();
  }, []);

  const loadMyAssignments = async () => {
    try {
      // Use the user-specific API to get only current user's assignments
      const assignmentsData = await api.getMyAssignments();
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
    } catch (error) {
      console.error('Failed to load your assignments:', error);
      Alert.alert('Error', 'Failed to load your delivery assignments');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <TouchableWithoutFeedback onPress={closeSidebar}>
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <Sidebar
          visible={sidebarVisible}
          onVisibleChange={setSidebarVisible}
          top={insets.top + 8}
          onNavigate={navigateAndClose}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading your assignments...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.pageTitle}>Welcome, {userName}!</Text>
            <Text style={styles.subtitle}>Your Current Assignments</Text>

            {assignments.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="local-shipping" size={64} color="#888" />
                <Text style={styles.emptyStateText}>No assignments found</Text>
                <Text style={styles.emptyStateSubtext}>
                  You don't have any delivery assignments at the moment.
                </Text>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={loadMyAssignments}
                >
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              assignments.map((assignment) => (
                <TouchableOpacity
                  key={assignment.assignment_id}
                  style={styles.assignmentCard}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/taskdetails', params: { id: assignment.assignment_id } })}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                      <View style={styles.assignmentTypeBadge}>
                        <Text style={styles.assignmentTypeText}>
                          {getAssignmentTypeLabel(assignment.assignment_type)}
                        </Text>
                      </View>
                      <View 
                        style={[
                          styles.statusPill, 
                          { backgroundColor: getStatusColor(assignment.status) }
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {assignment.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                    <Icon name="open-in-new" size={20} color="#000" />
                  </View>

                  <View style={styles.routeInfo}>
                    <View style={styles.locationRow}>
                      <View style={styles.locationDot} />
                      <View style={styles.locationInfo}>
                        <Text style={styles.locationType}>
                          From: {getLocationTypeLabel(assignment.from_location_type)}
                        </Text>
                        <Text style={styles.locationName}>
                          {assignment.from_branch_name || 'Office'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.connectorLine} />

                    <View style={styles.locationRow}>
                      <View style={[styles.locationDot, styles.locationDotDest]} />
                      <View style={styles.locationInfo}>
                        <Text style={styles.locationType}>
                          To: {getLocationTypeLabel(assignment.to_location_type)}
                        </Text>
                        <Text style={styles.locationName}>
                          {assignment.to_branch_name || 'Office'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.assignmentDetails}>
                    {assignment.amount && (
                      <View style={styles.detailRow}>
                        <Icon name="attach-money" size={14} color="#6021F3" />
                        <Text style={styles.detailText}>
                          Amount: ₱{parseFloat(assignment.amount).toLocaleString()}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.detailRow}>
                      <Icon name="event" size={14} color="#6021F3" />
                      <Text style={styles.detailText}>
                        Due: {formatDate(assignment.due_date)}
                      </Text>
                    </View>

                    {assignment.assigned_by_name && (
                      <View style={styles.detailRow}>
                        <Icon name="person" size={14} color="#6021F3" />
                        <Text style={styles.detailText}>
                          Assigned by: {assignment.assigned_by_name}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardHint}>
                    <Icon name="info" size={14} color="#6021F3" />
                    <Text style={styles.cardHintText}>
                      Tap for full details & items list
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const PURPLE = '#6021F3';
const YELLOW = '#FFB84D';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PURPLE },
  scrollContainer: { 
    paddingVertical: 20, 
    paddingHorizontal: 16,
    paddingTop: 45 
  },
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
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
    textAlign: 'center',
  },
  assignmentCard: {
    backgroundColor: YELLOW,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  assignmentTypeBadge: {
    backgroundColor: '#6021F3',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  assignmentTypeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  statusPill: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
  },
  routeInfo: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6021F3',
    marginTop: 4,
  },
  locationDotDest: {
    backgroundColor: '#34A853',
  },
  locationInfo: {
    flex: 1,
  },
  locationType: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  locationName: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    marginTop: 2,
  },
  connectorLine: {
    width: 2,
    height: 16,
    backgroundColor: '#6021F3',
    marginLeft: 5,
    marginVertical: 2,
  },
  assignmentDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#000',
  },
  cardHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cardHintText: {
    color: '#6021F3',
    fontWeight: '600',
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    marginTop: 40,
  },
  emptyStateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#FFB84D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#6021F3',
    fontWeight: '600',
    fontSize: 16,
  },
});
