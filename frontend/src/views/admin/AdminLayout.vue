<template>
  <div class="app-root">
    <header>
      <div class="header-title">
        <h1>{{ authStore.isAdmin ? "Admin" : "Recorder" }} Panel</h1>
        <span class="role-badge" :class="`badge-${user?.role}`">
          {{ user?.role }}
        </span>
      </div>
      <nav>
        <ul>
          <li><router-link to="/admin">Dashboard</router-link></li>
          <li><router-link to="/admin/archers">Archers</router-link></li>
          <li><router-link to="/admin/scores">Scores</router-link></li>
          <li><router-link to="/admin/rounds">Rounds</router-link></li>
          <li>
            <router-link to="/admin/competitions">Competitions</router-link>
          </li>
          <li>
            <router-link to="/admin/championships">Championships</router-link>
          </li>
        </ul>
      </nav>

      <div
        style="
          margin-top: auto;
          padding-top: 24px;
          border-top: 1px solid var(--muted);
        "
      >
        <p style="margin: 0 0 8px; font-size: 14px; color: var(--muted-text)">
          {{ user?.firstName }} {{ user?.lastName }}
        </p>
        <button
          @click="handleLogout"
          style="
            background: none;
            border: none;
            color: var(--brand);
            font-weight: 600;
            cursor: pointer;
            padding: 0;
          "
        >
          Logout
        </button>
      </div>
    </header>

    <router-view />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const user = computed(() => authStore.user);

function handleLogout() {
  authStore.logout();
  router.push("/login");
}
</script>

<style scoped>
.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.header-title h1 {
  margin: 0;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-admin {
  background: #dc3545;
  color: white;
}

.badge-recorder {
  background: #ffc107;
  color: #000;
}
</style>
