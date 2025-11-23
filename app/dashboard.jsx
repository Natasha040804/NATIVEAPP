import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import Sidebar from "../components/Sidebar";
import StatsCard from "../components/StatsCard";
import { api } from "../lib/api";

export default function Dashboard() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [stats, setStats] = useState({ active: 0, completedToday: 0, pending: 0 });
  const [deliveries, setDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);
  const [deliveriesError, setDeliveriesError] = useState(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const navigateAndClose = (path) => {
    setSidebarVisible(false);
    router.push(path);
  };

  const closeSidebar = () => {
    if (sidebarVisible) setSidebarVisible(false);
  };

  const normalizeAssignments = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload?.data && Array.isArray(payload.data)) return payload.data;
    if (payload?.assignments && Array.isArray(payload.assignments)) return payload.assignments;
    if (payload?.results && Array.isArray(payload.results)) return payload.results;
    return [];
  };

  const calculateStats = (items) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    let active = 0;
    let completedToday = 0;
    let pending = 0;
    items.forEach((assignment) => {
      const status = String(assignment?.status || '').toUpperCase();
      if (status === 'IN_PROGRESS') active += 1;
      if (status === 'COMPLETED' && assignment?.updated_at?.slice(0, 10) === todayStr) {
        completedToday += 1;
      }
      if (status === 'ASSIGNED' || status === 'PENDING') pending += 1;
    });
    return { active, completedToday, pending };
  };

  const transformDeliveries = (items) => {
    return items
      .slice()
      .sort((a, b) => new Date(b?.updated_at || b?.created_at || 0) - new Date(a?.updated_at || a?.created_at || 0))
      .slice(0, 6)
      .map((assignment) => ({
        id: assignment.assignment_code || `ASN-${assignment.assignment_id}`,
        person: assignment.assigned_to_name || assignment.driver_name || 'Unassigned',
        address: assignment.to_branch_address || assignment.to_branch_name || 'Destination pending',
        time: formatTime(assignment.updated_at || assignment.created_at),
      }));
  };

  const formatTime = (value) => {
    if (!value) return '--:--';
    try {
      return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const filteredDeliveries = useMemo(() => {
    if (!selectedPersonnel) return deliveries;
    return deliveries.filter((d) => d.person && d.person.toLowerCase() === selectedPersonnel.toLowerCase());
  }, [deliveries, selectedPersonnel]);

  const loadDashboardData = async () => {
    setLoadingDeliveries(true);
    setDeliveriesError(null);
    try {
      const res = await api.getDeliveryAssignments();
      const list = normalizeAssignments(res);
      setStats(calculateStats(list));
      setDeliveries(transformDeliveries(list));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setDeliveriesError(error?.message || 'Failed to load assignments');
    } finally {
      setLoadingDeliveries(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={closeSidebar}>
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        {/* Top bar + dropdown (reusable Sidebar) */}
        <Sidebar
          visible={sidebarVisible}
          onVisibleChange={setSidebarVisible}
          top={insets.top + 8}
          onNavigate={navigateAndClose}
        />

        {/* ===== Dashboard Content ===== */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* ==== Stats Section ==== */}
          <View style={styles.statsContainer}>
            <StatsCard iconName="assignment" iconColor="#4285F4" title="Active Tasks" value={String(stats.active)} />
            <StatsCard iconName="check-circle" iconColor="#34A853" title="Completed Today" value={String(stats.completedToday)} />
            <StatsCard iconName="schedule" iconColor="#FBBC05" title="Pending Tasks" value={String(stats.pending)} />
          </View>

          {/* ==== Deliveries by Personnel Pie ==== */}
        
          {/* ==== Filtered Deliveries List ==== */}
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>
              {selectedPersonnel ? `${selectedPersonnel}'s Deliveries` : 'Recent Deliveries'}
            </Text>
            {loadingDeliveries && (
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={PURPLE} size="small" />
                <Text style={styles.loadingLabel}>Fetching deliveries...</Text>
              </View>
            )}
            {deliveriesError && !loadingDeliveries && (
              <Text style={styles.errorTextSmall}>{deliveriesError}</Text>
            )}
            {!loadingDeliveries && !deliveriesError && filteredDeliveries.length === 0 && (
              <Text style={styles.emptyState}>No deliveries found.</Text>
            )}
            {!loadingDeliveries && !deliveriesError && filteredDeliveries.map((d) => (
              <View key={d.id} style={styles.deliveryRow}>
                <View style={styles.deliveryLeft}>
                  <Icon name="local-shipping" size={20} color="#6021F3" />
                  <Text style={styles.deliveryId}>{d.id}</Text>
                </View>
                <View style={styles.deliveryCenter}>
                  <Text style={styles.deliveryAddress}>{d.address}</Text>
                  <Text style={styles.deliveryMeta}>By {d.person}</Text>
                </View>
                <Text style={styles.deliveryTime}>{d.time}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.refreshBtn} onPress={loadDashboardData}>
              <Text style={styles.refreshText}>Refresh Data</Text>
            </TouchableOpacity>
          </View>

          {/* ==== Notifications ==== */}
          
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const PURPLE = "#6021F3";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PURPLE },
  scrollContainer: { alignItems: "center", paddingBottom: 50, paddingTop: 40 },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
    gap: 12,
  },
  // card styles moved into reusable component
  notificationsContainer: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 16,
    padding: 16,
    marginTop: 25,
  },
  chartContainer: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 25,
  },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  listContainer: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  listTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  deliveryLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deliveryId: { color: '#000', fontWeight: '600' },
  deliveryCenter: { flex: 1, marginLeft: 10 },
  deliveryAddress: { color: '#000' },
  deliveryMeta: { color: '#666', fontSize: 12 },
  deliveryTime: { color: '#000', fontWeight: '600' },
  loadingBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingLabel: {
    color: '#666',
  },
  emptyState: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 12,
  },
  errorTextSmall: {
    color: '#dc2626',
    fontSize: 12,
    marginBottom: 8,
  },
  refreshBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#6021F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshText: {
    color: '#fff',
    fontWeight: '600',
  },
  notificationsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  notification: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9F9F9",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  notificationText: { flex: 1, color: "#000", marginLeft: 10 },
  time: { color: "#555", fontSize: 12 },
});
