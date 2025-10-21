<template>
  <div class="dashboard">
    <h1>Welcome, {{ user?.firstName }}!</h1>

    <section class="dashboard-card">
      <h3>My Scores</h3>
      <div class="stat">{{ stats.totalScores }}</div>
      <p>Total scores recorded</p>
    </section>

    <section class="dashboard-card">
      <h3>Personal Best</h3>
      <div class="stat">{{ stats.personalBest }}</div>
      <p>Highest score</p>
    </section>

    <section class="quick-action">
      <div class="dashboard-card">
        <h3>Quick Actions</h3>
        <div class="actions">
          <router-link to="/archer/score-entry" class="action-btn"
            >Enter New Score</router-link
          >
          <router-link to="/archer/scores" class="action-btn"
            >View My Scores</router-link
          >
          <router-link to="/archer/competitions" class="action-btn"
            >Browse Competitions</router-link
          >
          <router-link to="/archer/rounds" class="action-btn"
            >View Rounds</router-link
          >
          <router-link to="/archer/profile" class="action-btn"
            >My Profile</router-link
          >
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";

const authStore = useAuthStore();
const user = computed(() => authStore.user);

const stats = ref({
  totalScores: 0,
  personalBest: 0,
});

onMounted(async () => {
  if (!user.value) return;

  try {
    const response = await api.get(`/archers/${user.value.archerId}/scores`);
    const scores = response.data.scores || [];
    stats.value.totalScores = scores.length;

    if (scores.length > 0) {
      stats.value.personalBest = Math.max(...scores.map((s) => s.TotalScore));
    }
  } catch (error) {
    console.error("Failed to load stats:", error);
  }
});
</script>
