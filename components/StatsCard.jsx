import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';

// Reusable statistics card component
// Props:
// - iconName: MaterialIcons name
// - iconColor: icon color
// - title: label text
// - value: main value text
// - style: optional container style override/extension
export default function StatsCard({ iconName, iconColor = '#000', title, value, style }) {
  return (
    <View style={[styles.card, style]}>
      <Icon name={iconName} size={30} color={iconColor} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    width: '42%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  cardTitle: { fontSize: 14, color: '#000', marginTop: 5 },
  cardValue: { fontSize: 22, fontWeight: 'bold', color: '#000', marginTop: 4 },
});
