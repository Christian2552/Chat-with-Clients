<template>
  <div class="logout-container">
    <button class="Log-Out" @click="logoutHandler">Log Out</button>
  </div>

  <div class="support-wrapper">
    <div class="clients-list">
      <h3>Clients</h3>
      <ul>
        <li
          v-for="client in clients"
          :key="client.id"
          :class="{ active: selectedClient?.id === client.id }"
          @click="selectClient(client)"
        >
          {{ client.name }}
        </li>
      </ul>
    </div>

    <div class="chat-area">
      <div class="chat-header">
        <h2>Chat with {{ selectedClient?.name || "..." }}</h2>
      </div>

      <div class="chat-box" ref="chatBox">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['chat-message', msg.sender_id === supportId ? 'sent' : 'received']"
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
          :disabled="!selectedClient"
        />
        <button @click="sendMessage" :disabled="!selectedClient">Send</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/utils/supabaseClient";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

interface Client {
  id: string; 
  name: string;
}

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
}

const router = useRouter();
const clients = ref<Client[]>([]);
const selectedClient = ref<Client | null>(null);
const messages = ref<Message[]>([]);
const newMessage = ref("");
const chatBox = ref<HTMLElement | null>(null);
const supportId = ref<string>("");

let channel: ReturnType<typeof supabase.channel> | null = null;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function scrollToBottom() {
  nextTick(() => {
    chatBox.value?.scrollTo({ top: chatBox.value.scrollHeight, behavior: "smooth" });
  });
}

async function logoutHandler() {
  await supabase.auth.signOut();
  router.push("/authentication");
}

async function fetchClients() {
  if (!supportId.value) return;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .not("id", "eq", supportId.value);

  if (!error && data) {
    clients.value = data.map((p) => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
    }));
  }
}

function selectClient(client: Client) {
  selectedClient.value = client;
  fetchMessages();
}

async function fetchMessages() {
  if (!selectedClient.value || !supportId.value) return;

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${supportId.value},receiver_id.eq.${selectedClient.value.id}),and(sender_id.eq.${selectedClient.value.id},receiver_id.eq.${supportId.value})`
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
  if (!newMessage.value.trim()) return;
  if (!supportId.value || !selectedClient.value) {
    console.error("❌ Support user or client not selected");
    return;
  }

  const { data, error } = await supabase.from("messages").insert({
    sender_id: supportId.value,
    receiver_id: selectedClient.value.id,
    message: newMessage.value.trim(),
  }).select();

  if (error) {
    console.error("❌ Error sending message:", error.message);
    return;
  }

  if (data && data.length > 0) {
    messages.value.push(data[0]);
    newMessage.value = "";
    scrollToBottom();
  }
}

async function setupRealtime() {
  channel = supabase
    .channel("client-chat")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload: RealtimePostgresInsertPayload<any>) => {
        const newMsg = payload.new as Message;

        if (
          selectedClient.value &&
          ((newMsg.sender_id === supportId.value && newMsg.receiver_id === selectedClient.value.id) ||
            (newMsg.sender_id === selectedClient.value.id && newMsg.receiver_id === supportId.value))
        ) {
          messages.value.push(newMsg);
          scrollToBottom();
        }
      }
    )
    .subscribe();
}

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    router.push("/auth");
    return;
  }

  supportId.value = session.user.id;
  await fetchClients();
  await setupRealtime();
});

onUnmounted(() => {
  if (channel) supabase.removeChannel(channel);
});
</script>

<style src="../assets/SuppRequests.css"></style>
