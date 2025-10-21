<template>
  <div class="dashboard">
    <h1>{{ authStore.isAdmin ? "Admin" : "Recorder" }} Dashboard</h1>
    <p style="color: var(--muted-text); margin-top: -12px">
      Welcome back, {{ authStore.user?.firstName }}!
      <span v-if="!authStore.isAdmin" style="font-style: italic">
        (Score Recorder)
      </span>
    </p>

    <section class="dashboard-card">
      <h3>Total Archers</h3>
      <div class="stat">{{ stats.totalArchers }}</div>
      <p>Registered users</p>
    </section>

    <section class="dashboard-card">
      <h3>Pending Scores</h3>
      <div class="stat">{{ stats.pendingScores }}</div>
      <p>Awaiting approval</p>
    </section>

    <section class="dashboard-card">
      <h3>Total Competitions</h3>
      <div class="stat">{{ stats.totalCompetitions }}</div>
      <p>This year</p>
    </section>

    <section class="dashboard-card">
      <h3>Total Rounds</h3>
      <div class="stat">{{ stats.totalRounds }}</div>
      <p>Available rounds</p>
    </section>

    <section class="quick-action">
      <div class="dashboard-card">
        <h3>Quick Actions</h3>
        <div class="actions">
          <router-link to="/admin/scores" class="action-btn"
            >Review Scores</router-link
          >
          <router-link to="/admin/archers" class="action-btn"
            >Manage Archers</router-link
          >
          <router-link to="/admin/competitions" class="action-btn"
            >Create Competition</router-link
          >
          <router-link to="/admin/rounds" class="action-btn"
            >Manage Rounds</router-link
          >
        </div>
      </div>
    </section>

    <section class="dashboard-card" style="grid-column: 1/-1">
      <h3>Recent Activity</h3>
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="recentScores.length === 0">
        <p>No recent activity</p>
      </div>
      <div v-else style="max-height: 300px; overflow-y: auto">
        <div
          v-for="score in recentScores"
          :key="score.ScoreRecordID"
          style="padding: 8px 0; border-bottom: 1px solid var(--muted)"
        >
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
            "
          >
            <div>
              <strong
                >{{ score.archer.FirstName }}
                {{ score.archer.LastName }}</strong
              >
              - {{ score.round.Name }} ({{ score.TotalScore }})
            </div>
            <span :class="`badge badge-${score.Status}`">{{
              score.Status
            }}</span>
          </div>
          <small style="color: var(--muted-text)">{{
            formatDate(score.DateShot)
          }}</small>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";

const authStore = useAuthStore();

const stats = ref({
  totalArchers: 0,
  pendingScores: 0,
  totalCompetitions: 0,
  totalRounds: 0,
});

const recentScores = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    // Fetch stats
    const [archersRes, scoresRes, roundsRes] = await Promise.all([
      api.get("/archers"),
      api.get("/scores/staged/list"),
      api.get("/rounds"),
    ]);

    stats.value.totalArchers = archersRes.data.archers?.length || 0;
    stats.value.pendingScores = scoresRes.data.scores?.length || 0;
    stats.value.totalRounds = roundsRes.data.rounds?.length || 0;

    // Fetch recent scores
    const recentRes = await api.get("/scores?limit=10");
    recentScores.value = recentRes.data.scores || [];
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
  } finally {
    loading.value = false;
  }
});

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
</script>
