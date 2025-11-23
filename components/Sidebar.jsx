// components/Sidebar.jsx
import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, Image, Text } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

// Reusable horizontal top bar with dropdown menu.
// Props:
// - visible?: boolean (optional controlled visibility of dropdown)
// - top: number (y offset from top)
// - onNavigate?: (route: string) => void
export default function Sidebar({ visible, top = 12, onNavigate, onVisibleChange, onLogout }) {
  const [open, setOpen] = useState(false);
  const controlled = typeof visible === 'boolean';
  const isOpen = controlled ? visible : open;
  const drop = useRef(new Animated.Value(0)).current; // 0 closed, 1 open
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    Animated.timing(drop, {
      toValue: isOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isOpen, drop]);

  const handlePress = (route) => {
    if (onNavigate) onNavigate(route);
    else router.push(route);
    if (!controlled) setOpen(false);
  };

  const closeMenu = () => {
    if (controlled) {
      onVisibleChange && onVisibleChange(false);
    } else {
      setOpen(false);
    }
  };

  const toggle = () => {
    if (controlled) {
      onVisibleChange && onVisibleChange(!visible);
      return;
    }
    setOpen((v) => !v);
  };

  const translateY = drop.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });
  const opacity = drop;

  return (
    <View style={[styles.wrapper, { top }]}> 
      {/* Top horizontal bar */}
      <View style={styles.bar}>
        <TouchableOpacity style={styles.menuBtn} onPress={toggle} accessibilityLabel="Open menu">
          <Icon name="menu" size={28} color={PURPLE} />
          <Text style={styles.menuText}></Text>
        </TouchableOpacity>

        <Image source={require('../assets/mze1.png')} style={styles.logo} resizeMode="contain" />

        <TouchableOpacity style={styles.profileBtn} onPress={() => handlePress('/profile')} accessibilityLabel="Profile">
          <Image source={require('../assets/photo.jpg')} style={styles.profileImg} />
        </TouchableOpacity>
      </View>

      {/* Dropdown menu */}
      <Animated.View
        style={[styles.dropdown, { opacity, transform: [{ translateY }] }]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      > 
        {[
          { icon: 'home', label: 'Home', route: '/dashboard' },
          { icon: 'assignment', label: 'My Assignments', route: '/deliveryinfo' },
          { icon: 'assignment-turned-in', label: 'Completed Deliveries', route: '/completed-deliveries' },
          { icon: 'chat', label: 'Messaging', route: '/messaging' },
        ].map((it) => (
          <TouchableOpacity key={it.label} style={styles.dropItem} onPress={() => handlePress(it.route)}>
            <Icon name={it.icon} size={22} color="#000" />
            <Text style={styles.dropLabel}>{it.label}</Text>
          </TouchableOpacity>
        ))}

        {/* Dedicated Logout button calling context logout (or onLogout if provided) */}
        <TouchableOpacity
          style={styles.dropItem}
          onPress={async () => {
            try {
              if (typeof onLogout === 'function') {
                await onLogout();
              } else if (logout) {
                await logout();
              }
            } finally {
              closeMenu();
            }
          }}
        >
          <Icon name="logout" size={22} color="#000" />
          <Text style={styles.dropLabel}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const BG = '#6021F3';
const YELLOW = '#FFB84D';
const PURPLE = '#6021F3';

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 10,
    right: 10,
    zIndex: 20,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: YELLOW,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 64,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 2,
    borderColor: PURPLE,
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  menuText: { color: PURPLE, fontSize: 10, fontWeight: '600', lineHeight: 12 },
  logo: { width: 160, height: 40 },
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImg: { width: '100%', height: '100%' },
  dropdown: {
    position: 'absolute',
    top: 64 + 8,
    left: 5, // increase side margins to narrow dropdown
    right: 270,
    width: 200,
    backgroundColor: '#FFD88A',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
  },
  dropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  dropLabel: { color: '#000', fontWeight: '600' },
});