import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import Icon from "@expo/vector-icons/MaterialIcons";
import Sidebar from "../components/Sidebar";

export default function ChatScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [messages, setMessages] = useState([
    { id: "1", text: "Hi! Kumusta?", sender: "other" },
    { id: "2", text: "Okay naman! Ikaw?", sender: "me" },
    { id: "3", text: "WOW TAINA GALING", sender: "other" },
  ]);
  const [text, setText] = useState("");

  const sendMessage = () => {
    if (!text.trim()) return;
    const newMsg = { id: Date.now().toString(), text, sender: "me" };
    setMessages((prev) => [...prev, newMsg]);
    setText("");
  };

  return (
    <LinearGradient
      colors={["#6021F3", "#8B4DFF"]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <Sidebar
          visible={sidebarVisible}
          onVisibleChange={setSidebarVisible}
          top={30}
          onNavigate={(path) => {
            setSidebarVisible(false);
            router.push(path);
          }}
        />

        {/* Header with Rounded Background */}
        <View style={styles.headerWrapper}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.push("/messaging")}
            >
              <Icon name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{name}</Text>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.chatArea}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.sender === "me"
                  ? styles.myMessage
                  : styles.otherMessage,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  item.sender === "me"
                    ? { color: "#fff" }
                    : { color: "#000" },
                ]}
              >
                {item.text}
              </Text>
            </View>
          )}
        />

        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#777"
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Icon name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const PURPLE = "#6021F3";
const YELLOW = "#FFB84D";

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: {
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    marginTop: 80,
  },
  header: {
    backgroundColor: YELLOW,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: PURPLE,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 3,
  },
  backBtn: {
    marginRight: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  chatArea: {
    flex: 1,
    padding: 14,
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 18,
    padding: 10,
    marginVertical: 5,
  },
  myMessage: {
    backgroundColor: PURPLE,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: "#F1F1F1",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 15 },
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    flex: 1,
    backgroundColor: "#F6F6F6",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    color: "#000",
  },
  sendBtn: {
    backgroundColor: PURPLE,
    borderRadius: 25,
    marginLeft: 8,
    padding: 10,
  },
});

