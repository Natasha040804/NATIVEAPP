import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import Sidebar from '../components/Sidebar';

export default function Messaging() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', from: 'Ron', text: 'On my way to the next drop.', time: '10:15' },
    { id: '2', from: 'Dispatch', text: 'Copy. Watch for traffic on EDSA.', time: '10:16' },
  ]);
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);

  const send = () => {
    if (!input.trim()) return;
    const newMsg = { id: String(Date.now()), from: 'Me', text: input.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const closeSidebar = () => { if (sidebarVisible) setSidebarVisible(false); };

  return (
    <TouchableWithoutFeedback onPress={closeSidebar}>
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <Sidebar visible={sidebarVisible} onVisibleChange={setSidebarVisible} top={insets.top + 8} />

        <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
          <FlatList
            ref={listRef}
            contentContainerStyle={styles.listContent}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.from === 'Me' ? styles.me : styles.them]}>
                <Text style={styles.from}>{item.from}</Text>
                <Text style={styles.text}>{item.text}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
            )}
          />

          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message"
              placeholderTextColor="#888"
              value={input}
              onChangeText={setInput}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={send}>
              <Icon name="send" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const PURPLE = '#6021F3';
const YELLOW = '#FFB84D';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PURPLE },
  flex1: { flex: 1 },
  listContent: { paddingTop: 45, paddingHorizontal: 14, paddingBottom: 8 },
  bubble: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: '85%',
  },
  me: { alignSelf: 'flex-end', backgroundColor: '#E9D7FF' },
  them: { alignSelf: 'flex-start', backgroundColor: '#FFF' },
  from: { fontWeight: '700', color: '#000', marginBottom: 2 },
  text: { color: '#000' },
  time: { color: '#666', fontSize: 12, marginTop: 4, alignSelf: 'flex-end' },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 14,
    backgroundColor: '#F3F3F3',
    color: '#000',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
