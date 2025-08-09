<template>
  <div class="logout-container">
    <button class="Log-Out" @click="logoutHandler">Log Out</button>
  </div>

  <div class="chat-wrapper">
    <div class="chat-header">
      <h2>Support Chat</h2>
    </div>

    <div class="chat-box" ref="chatBox">
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['chat-message', msg.sender_id === userId ? 'sent' : 'received']"
      >
        <p>{{ msg.message }}</p>
        <small class="timestamp">{{ formatDate(msg.created_at) }}</small>
      </div>
    </div>

    <div class="chat-input">
      <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        placeholder="Type a message..."
        :disabled="!userId"
      />
      <button @click="sendMessage" :disabled="!userId">Send</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/utils/supabaseClient";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

const router = useRouter();

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
}

const messages = ref<Message[]>([]);
const newMessage = ref("");
const userId = ref<string | null>(null);
const supportId = "af5e63ec-c809-4d42-b92a-1a33e26a3360"; // Replace with your real support user ID
const chatBox = ref<HTMLElement | null>(null);

function scrollToBottom() {
  nextTick(() => {
    chatBox.value?.scrollTo({ top: chatBox.value.scrollHeight, behavior: "smooth" });
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function logoutHandler() {
  await supabase.auth.signOut();
  router.push("/"); // Redirect to authentication page (root)
}

async function fetchMessages() {
  if (!userId.value) return;

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${userId.value},receiver_id.eq.${supportId}),and(sender_id.eq.${supportId},receiver_id.eq.${userId.value})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ Error fetching messages:", error.message);
    return;
  }

  messages.value = data as Message[];
  scrollToBottom();
}

async function sendMessage() {
  if (!newMessage.value.trim() || !userId.value) return;

  const messageToSend = newMessage.value.trim();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: userId.value,
      receiver_id: supportId,
      message: messageToSend,
    })
    .select()
    .single();

  if (error) {
    console.error("❌ Error sending message:", error.message);
    return;
  }

  // Push the sent message immediately to the UI
  messages.value.push(data);

  newMessage.value = "";

  // Scroll down after DOM update
  nextTick(() => {
    scrollToBottom();
  });
}


onMounted(async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    console.error("❌ User not logged in");
    return;
  }

  userId.value = data.user.id;
  await fetchMessages();

  supabase
    .channel("client-chat")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload: RealtimePostgresInsertPayload<any>) => {
        const newMsg = payload.new as Message;

        // Only add messages related to this chat
        if (
          (newMsg.sender_id === supportId && newMsg.receiver_id === userId.value) ||
          (newMsg.sender_id === userId.value && newMsg.receiver_id === supportId)
        ) {
          // Check if message already exists (optional)
          if (!messages.value.find(m => m.id === newMsg.id)) {
            messages.value.push(newMsg);

            // Wait for Vue to update DOM, then scroll
            nextTick(() => {
              scrollToBottom();
            });
          }
        }
      }
    )
    .subscribe();
});

</script>

<style src="../assets/Requests.css"></style>
