import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import Sidebar from '../components/Sidebar';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function Messaging() {
  const { user } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [recipientModalVisible, setRecipientModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConversationDropdown, setShowConversationDropdown] = useState(false);
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);

  const currentUserId = useMemo(() => {
    if (!user) return null;
    const candidate =
      user?.Account_id ??
      user?.accountId ??
      user?.AccountId ??
      user?.id ??
      user?.userId;
    return typeof candidate === 'number' ? candidate : candidate ? Number(candidate) : null;
  }, [user]);

  const userName = useMemo(() => {
    return user?.Fullname || user?.fullname || user?.username || 'Messenger User';
  }, [user]);

  const userRole = useMemo(() => {
    return user?.Role || user?.role || 'Logistics';
  }, [user]);

  const userInitials = useMemo(() => {
    return (userName || 'U')
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [userName]);

  const loadMessages = async (conversationKey, participant) => {
    if (!conversationKey) return;
    setLoadingMessages(true);
    setError(null);
    try {
      const data = await api.getConversationMessages(conversationKey);
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
      if (data?.participant) {
        setActiveConversation((prev) => ({
          ...(prev || {}),
          conversationKey: data.conversationKey || conversationKey,
          participant: data.participant,
        }));
      } else if (participant) {
        setActiveConversation((prev) => ({
          ...(prev || {}),
          conversationKey,
          participant,
        }));
      }
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (err) {
      console.error('Failed to load conversation', err);
      setError(err?.message || 'Failed to load conversation');
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadConversation = async (conversation) => {
    if (!conversation) return;
    setActiveConversation(conversation);
    if (!conversation.conversationKey) {
      setMessages([]);
      return;
    }
    await loadMessages(conversation.conversationKey, conversation.participant);
  };

  const handleConversationSelect = async (conversation) => {
    await loadConversation(conversation);
    setShowConversationDropdown(false);
  };

  const fetchConversations = async ({ autoSelect = false } = {}) => {
    setLoadingConversations(true);
    setError(null);
    try {
      const data = await api.getMessageConversations();
      const list = Array.isArray(data) ? data : [];
      setConversations(list);
      if ((autoSelect || !activeConversation) && list.length) {
        await loadConversation(list[0]);
      } else if (activeConversation?.conversationKey) {
        const next = list.find((c) => c.conversationKey === activeConversation.conversationKey);
        if (next) {
          setActiveConversation((prev) => ({ ...prev, ...next }));
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError(err?.message || 'Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchRecipients = async () => {
    try {
      const data = await api.getMessageRecipients();
      setRecipients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load recipients:', err?.message || err);
    }
  };

  const loadInitialData = async () => {
    await Promise.all([fetchRecipients(), fetchConversations({ autoSelect: true })]);
  };

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!activeConversation?.participant?.accountId) {
      setError('Please select a recipient before sending.');
      return;
    }
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      const response = await api.sendMessage({
        recipientId: activeConversation.participant.accountId,
        message: text,
      });
      if (response?.message) {
        setMessages((prev) => [...prev, response.message]);
      }
      if (!activeConversation.conversationKey && response?.conversationKey) {
        await loadMessages(response.conversationKey, response.participant || activeConversation.participant);
      }
      await fetchConversations();
    } catch (err) {
      console.error('Failed to send message', err);
      setError(err?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const startConversationWith = (recipient) => {
    setRecipientModalVisible(false);
    if (!recipient) return;
    const existing = conversations.find((c) => c.participant?.accountId === recipient.accountId);
    if (existing) {
      loadConversation(existing);
      return;
    }
    setActiveConversation({
      conversationKey: null,
      participant: recipient,
      lastMessage: null,
      unreadCount: 0,
    });
    setMessages([]);
  };

  const closeSidebar = () => {
    if (sidebarVisible) setSidebarVisible(false);
  };

  const conversationLabel =
    activeConversation?.participant?.fullName ||
    activeConversation?.participant?.username ||
    'Select a conversation';

  const filteredRecipients = useMemo(() => {
    return [...recipients].sort((a, b) => {
      const labelA = (a.fullName || a.username || '').toLowerCase();
      const labelB = (b.fullName || b.username || '').toLowerCase();
      return labelA.localeCompare(labelB);
    });
  }, [recipients]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => {
      const label = (conversation.participant?.fullName || conversation.participant?.username || '')
        .toLowerCase();
      const lastMessage = (conversation.lastMessage || '').toLowerCase();
      return label.includes(query) || lastMessage.includes(query);
    });
  }, [conversations, searchQuery]);

  const renderMessage = ({ item }) => {
    const idMatches =
      currentUserId !== null &&
      typeof item.senderId !== 'undefined' &&
      Number(item.senderId) === Number(currentUserId);
    const nameMatches =
      !idMatches &&
      item.senderName &&
      user?.Fullname &&
      item.senderName.toLowerCase() === user.Fullname.toLowerCase();
    const legacyMeFlag = !idMatches && !nameMatches && String(item.from || '').toLowerCase() === 'me';
    const isMine = idMatches || nameMatches || legacyMeFlag;
    return (
      <View style={[styles.bubble, isMine ? styles.me : styles.them]}>
        {!isMine && (
          <Text style={styles.from}>
            {item.senderName || activeConversation?.participant?.fullName || 'Contact'}
          </Text>
        )}
        <Text style={styles.text}>{item.text}</Text>
        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={closeSidebar}>
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={["#1b0a42", "#2c0d5e", "#0f0430"]}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Sidebar visible={sidebarVisible} onVisibleChange={setSidebarVisible} top={insets.top + 8} />

        
        

        <View style={styles.mainContent}>
          <View style={styles.singleColumn}>
            <View style={styles.dropdownSection}>
              <TouchableOpacity
                style={styles.dropdownToggle}
                onPress={() => setShowConversationDropdown((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View>
                  <Text style={styles.dropdownLabel}>Conversation</Text>
                  <Text style={styles.dropdownValue}>{conversationLabel}</Text>
                </View>
                <Icon
                  name={showConversationDropdown ? 'expand-less' : 'expand-more'}
                  size={26}
                  color="#fdf4ff"
                />
              </TouchableOpacity>

              {showConversationDropdown && (
                <View style={styles.dropdownContent}>
                  <View style={styles.searchBox}>
                    <Icon name="search" size={18} color="#b9a7ff" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search Messenger"
                      placeholderTextColor="#b6aee6"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.newMessageBtn}
                    onPress={() => setRecipientModalVisible(true)}
                  >
                    <Text style={styles.newMessageText}>+ New Message</Text>
                  </TouchableOpacity>

                  <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
                    {loadingConversations && (
                      <View style={styles.chatListEmpty}>
                        <ActivityIndicator color="#fff" />
                        <Text style={styles.loadingCopy}>Loading conversations...</Text>
                      </View>
                    )}
                    {!loadingConversations && !conversations.length && (
                      <View style={styles.chatListEmpty}>
                        <Text style={styles.loadingCopy}>No conversations yet</Text>
                      </View>
                    )}
                    {!loadingConversations && !!conversations.length && !filteredConversations.length && (
                      <View style={styles.chatListEmpty}>
                        <Text style={styles.loadingCopy}>No matches found</Text>
                      </View>
                    )}
                    {filteredConversations.map((conversation) => {
                      const isActive = conversation.conversationKey === activeConversation?.conversationKey;
                      return (
                        <TouchableOpacity
                          key={conversation.conversationKey || conversation.participant?.accountId}
                          style={[styles.chatListItem, isActive && styles.chatListItemActive]}
                          onPress={() => handleConversationSelect(conversation)}
                        >
                          <View style={styles.chatAvatarCircle}>
                            <Text style={styles.chatAvatarText}>
                              {(conversation.participant?.fullName || conversation.participant?.username || '?')
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.chatListCopy}>
                            <Text style={styles.chatPrimary} numberOfLines={1}>
                              {conversation.participant?.fullName || conversation.participant?.username || 'Contact'}
                            </Text>
                            <Text style={styles.chatSecondary} numberOfLines={1}>
                              {conversation.lastMessage || 'Start a conversation'}
                            </Text>
                          </View>
                          <View style={styles.chatMeta}>
                            <Text style={styles.chatTime}>{formatRelativeTime(conversation.lastMessageAt)}</Text>
                            {conversation.unreadCount > 0 && (
                              <View style={styles.badgeBubble}>
                                <Text style={styles.badgeBubbleText}>{conversation.unreadCount}</Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            <KeyboardAvoidingView
              style={styles.chatPanel}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
              <View style={styles.chatPanelHeader}>
                <View style={styles.chatTitleBlock}>
                  <Text style={styles.activeName}>{conversationLabel}</Text>
                  <View style={styles.statusLine}>
                    <View style={[styles.statusDot, activeConversation ? styles.statusDotOnline : styles.statusDotOffline]} />
                    <Text style={styles.activeStatus}>{activeConversation ? 'Active now' : 'Select a contact'}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.menuDots}>
                  <Icon name="more-vert" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              {loadingMessages ? (
                <View style={styles.loadingState}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.loadingCopy}>Loading conversation...</Text>
                </View>
              ) : (
                <FlatList
                  ref={listRef}
                  contentContainerStyle={styles.listContent}
                  data={messages}
                  keyExtractor={(item) => String(item.messageId)}
                  renderItem={renderMessage}
                  ListEmptyComponent={
                    <Text style={styles.emptyState}>
                      Select a conversation or start a new one to begin messaging.
                    </Text>
                  }
                />
              )}

              <View style={styles.composerBox}>
                <TouchableOpacity style={styles.attachmentBtn}>
                  <Icon name="attach-file" size={20} color="#c9bfff" />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder="Type a message..."
                  placeholderTextColor="#c9bfff"
                  value={input}
                  onChangeText={setInput}
                />
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={handleSend}
                  disabled={sending || !input.trim()}
                >
                  {sending ? <ActivityIndicator color="#2b104f" /> : <Icon name="send" size={22} color="#2b104f" />}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>

        <Modal visible={recipientModalVisible} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setRecipientModalVisible(false)}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalSheet}>
                  <Text style={styles.modalTitle}>Start a New Conversation</Text>
                  <ScrollView style={styles.modalList}>
                    {filteredRecipients.map((recipient) => (
                      <TouchableOpacity
                        key={recipient.accountId}
                        style={styles.recipientRow}
                        onPress={() => startConversationWith(recipient)}
                      >
                        <View style={styles.recipientAvatar}>
                          <Text style={styles.recipientAvatarText}>
                            {(recipient.fullName || recipient.username || '?')
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.recipientCopy}>
                          <Text style={styles.recipientName}>{recipient.fullName || recipient.username}</Text>
                          <Text style={styles.recipientRole}>{recipient.role || recipient.email || ''}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                    {!filteredRecipients.length && (
                      <Text style={styles.emptyRecipient}>No other users available.</Text>
                    )}
                  </ScrollView>
                  <TouchableOpacity
                    style={styles.closeModalBtn}
                    onPress={() => setRecipientModalVisible(false)}
                  >
                    <Text style={styles.closeModalText}>Close</Text>
                  </TouchableOpacity>
                </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const formatTime = (value) => {
  if (!value) return '--:--';
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
};

const formatRelativeTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
};

const PURPLE = '#6021F3';
const YELLOW = '#FFB84D';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PURPLE },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  menuToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: { flex: 1, alignItems: 'center' },
  appTitle: { color: '#fdf4ff', fontSize: 20, fontWeight: '700' },
  appSubtitle: { color: '#c3b5ff', fontSize: 12, marginTop: 2 },
  topBarProfile: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBarAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffd74f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarAvatarText: { color: '#2b104f', fontWeight: '700', fontSize: 16 },
  topBarName: { color: '#fff', fontWeight: '600' },
  topBarStatus: { color: '#d7c9ff', fontSize: 12 },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerCopy: { flex: 1, paddingRight: 12 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { color: '#F3F3F3', marginTop: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#8357f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  singleColumn: {
    flex: 1,
    gap: 16,
  },
  dropdownSection: {
    backgroundColor: 'rgba(24,7,46,0.85)',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 10,
  },
  dropdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  dropdownLabel: {
    color: '#cbb4ff',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dropdownValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  dropdownContent: {
    marginTop: 18,
    gap: 14,
  },
  dropdownList: {
    maxHeight: 320,
  },
  chatLayout: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  chatListColumn: {
    flex: 0.35,
    maxWidth: 280,
    minWidth: 150,
    flexGrow: 1,
    flexShrink: 0,
    backgroundColor: 'rgba(24,7,46,0.75)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 6,
  },
  chatListHeader: { gap: 10 },
  chatListHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatListToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatListTitle: { color: '#fcdcff', fontWeight: '700', fontSize: 18 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 10,
    height: 38,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  searchInput: { flex: 1, color: '#fff' },
  newMessageBtn: {
    backgroundColor: '#ffd74f',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  newMessageText: { fontWeight: '700', color: '#2c1464' },
  chatList: { marginTop: 12, flex: 1 },
  chatListEmpty: { padding: 20, alignItems: 'center', gap: 8 },
  expandChatsBtn: {
    minWidth: 120,
    alignSelf: 'flex-start',
    marginRight: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  expandChatsText: { color: '#fdf4ff', fontWeight: '600' },
  chatListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 12,
    backgroundColor: 'transparent',
  },
  chatListItemActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  chatAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fbcdfc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarText: { color: '#5200a1', fontWeight: '700' },
  chatListCopy: { flex: 1 },
  chatPrimary: { color: '#fff', fontWeight: '600' },
  chatSecondary: { color: '#bdaeea', fontSize: 12 },
  chatMeta: { alignItems: 'flex-end' },
  chatTime: { color: '#bdaeea', fontSize: 11 },
  badgeBubble: {
    marginTop: 4,
    backgroundColor: '#ff5a5f',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeBubbleText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  chatPanel: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    backgroundColor: 'rgba(33,11,70,0.92)',
    borderRadius: 32,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 8,
    marginTop: 4,
  },
  chatPanelExpanded: {
    flex: 1,
  },
  chatPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chatTitleBlock: { gap: 4 },
  activeName: { color: '#ffd74f', fontWeight: '700', fontSize: 22 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusDotOnline: { backgroundColor: '#5dd78b' },
  statusDotOffline: { backgroundColor: '#9a8bbd' },
  activeStatus: { color: '#cbb4ff', fontSize: 12 },
  menuDots: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { paddingHorizontal: 14, paddingBottom: 80, paddingTop: 10, gap: 8 },
  bubble: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginBottom: 12,
    maxWidth: '85%',
  },
  me: {
    alignSelf: 'flex-end',
    backgroundColor: '#c4b5fd',
    borderBottomRightRadius: 6,
    shadowColor: '#4b1d75',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  them: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  from: { fontWeight: '700', color: '#000', marginBottom: 2 },
  text: { color: '#000' },
  time: { color: '#666', fontSize: 12, marginTop: 4, alignSelf: 'flex-end' },
  composerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 10,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginTop: 12,
  },
  attachmentBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: '#fff',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffd74f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { color: '#FFD4D4', marginTop: 6 },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingCopy: { color: '#fff' },
  emptyState: {
    textAlign: 'center',
    color: '#ccc',
    marginTop: 40,
    paddingHorizontal: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalSheet: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 12 },
  modalList: { maxHeight: 320 },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    gap: 12,
  },
  recipientAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ece6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientAvatarText: { color: PURPLE, fontWeight: '700' },
  recipientCopy: { flex: 1 },
  recipientName: { fontWeight: '600', color: '#111' },
  recipientRole: { color: '#777', fontSize: 12 },
  emptyRecipient: { textAlign: 'center', color: '#777', paddingVertical: 24 },
  closeModalBtn: {
    marginTop: 16,
    alignSelf: 'flex-end',
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: PURPLE,
    borderRadius: 12,
  },
  closeModalText: { color: '#fff', fontWeight: '600' },
});
