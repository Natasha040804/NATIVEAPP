import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import Sidebar from "../components/Sidebar";
import StatsCard from "../components/StatsCard";

export default function Dashboard() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const navigateAndClose = (path) => {
    setSidebarVisible(false);
    router.push(path);
  };

  const closeSidebar = () => {
    if (sidebarVisible) setSidebarVisible(false);
  };

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
            <StatsCard iconName="assignment" iconColor="#4285F4" title="Active Tasks" value="8" />
            <StatsCard iconName="check-circle" iconColor="#34A853" title="Completed Today" value="14" />
            <StatsCard iconName="schedule" iconColor="#FBBC05" title="Pending Tasks" value="3" />
            <StatsCard iconName="error" iconColor="#EA4335" title="Issues / Delays" value="2" />
          </View>

          {/* ==== Deliveries by Personnel Pie ==== */}
        
          {/* ==== Filtered Deliveries List ==== */}
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>
              {selectedPersonnel ? `${selectedPersonnel}'s Deliveries` : 'Recent Deliveries'}
            </Text>
            {[ 
              { id: 'DLV-205', person: 'Ron', address: '12 North Ave', time: '10:20' },
              { id: 'DLV-206', person: 'Chris', address: '71 West St', time: '10:45' },
              { id: 'DLV-207', person: 'Joshua', address: '5 Main Rd', time: '11:10' },
              { id: 'DLV-208', person: 'Ron', address: '16 Pine Blvd', time: '11:25' },
            ]
              .filter((d) => !selectedPersonnel || d.person === selectedPersonnel)
              .map((d) => (
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
