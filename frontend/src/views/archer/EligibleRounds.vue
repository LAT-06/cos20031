<template>
  <main>
    <h1>Eligible Rounds</h1>
    <p style="color: var(--muted-text); margin-bottom: 24px">
      View rounds you are eligible to shoot based on your class and division
    </p>

    <div v-if="loading" class="loading">Loading eligible rounds...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else>
      <!-- Archer Info -->
      <div class="info-card" v-if="archerInfo">
        <h3>👤 {{ archerInfo.name }}</h3>
        <p><strong>Class:</strong> {{ archerInfo.class }}</p>
        <p><strong>Division:</strong> {{ archerInfo.division }}</p>
        <p><strong>Eligible Rounds:</strong> {{ eligibleRounds.length }} rounds available</p>
      </div>

      <!-- No rounds message -->
      <div v-if="eligibleRounds.length === 0" class="empty-state">
        <p style="font-size: 2rem; margin-bottom: 16px">🎯</p>
        <p style="font-size: 1.2rem; margin-bottom: 8px">No eligible rounds found</p>
        <p style="color: var(--muted-text)">
          {{ message || 'No rounds match your class and division' }}
        </p>
      </div>

      <!-- Rounds List -->
      <div v-else class="rounds-container">
        <div
          v-for="round in eligibleRounds"
          :key="round.RoundID"
          class="round-card"
        >
          <div class="round-header">
            <h3>🎯 {{ round.Name }}</h3>
            <div class="round-badges">
              <span v-if="round.Equipment" class="equipment-badge">
                {{ round.Equipment }}
              </span>
              <span v-if="round.refClass" class="class-badge">
                {{ round.refClass.Name }}
              </span>
              <span v-else class="class-badge all">
                All Classes
              </span>
            </div>
          </div>
          
          <p v-if="round.Description" class="description">
            {{ round.Description }}
          </p>

          <div class="ranges-info">
            <h4>Round Details:</h4>
            <div class="ranges-grid">
              <div
                v-for="range in round.ranges"
                :key="range.RoundRangeID"
                class="range-card"
              >
                <span class="range-label">Range {{ range.RangeNo }}</span>
                <div class="range-details">
                  <span>📏 {{ range.Distance }}m</span>
                  <span>🎯 {{ range.TargetFace }}</span>
                  <span>🔁 {{ range.Ends }} ends</span>
                  <span>🏹 {{ range.ArrowsPerEnd }} arrows/end</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";

const authStore = useAuthStore();
const loading = ref(false);
const error = ref("");
const message = ref("");
const archerInfo = ref(null);
const eligibleRounds = ref([]);

onMounted(() => {
  loadEligibleRounds();
});

async function loadEligibleRounds() {
  loading.value = true;
  error.value = "";

  try {
    const archerId = authStore.user?.archerId || authStore.user?.ArcherID;
    console.log('Loading eligible rounds for archer:', archerId);
    console.log('User object:', authStore.user);
    
    if (!archerId) {
      error.value = "Archer ID not found";
      return;
    }

    const response = await api.get(`/archers/${archerId}/eligible-rounds`);
    console.log('Eligible rounds response:', response.data);
    
    archerInfo.value = response.data.archer;
    eligibleRounds.value = response.data.eligibleRounds || [];
    message.value = response.data.message || "";

    if (response.data.message && eligibleRounds.value.length === 0) {
      error.value = response.data.message;
    }
  } catch (err) {
    console.error("Load eligible rounds error:", err);
    error.value = err.response?.data?.error || err.message || "Failed to load eligible rounds";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: var(--radius);
  margin-bottom: 32px;
  box-shadow: var(--shadow);
}

.info-card h3 {
  margin: 0 0 12px;
  font-size: 1.5rem;
}

.info-card p {
  margin: 8px 0;
  font-size: 1.1rem;
}

.rounds-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.round-card {
  background: var(--panel);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 24px;
  border-left: 4px solid var(--brand);
}

.round-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.round-header h3 {
  margin: 0;
  color: var(--brand);
  font-size: 1.5rem;
}

.round-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.equipment-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.class-badge {
  background: #10b981;
  color: white;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 600;
}

.class-badge.all {
  background: #6b7280;
}

.description {
  color: var(--muted-text);
  margin-bottom: 20px;
  font-style: italic;
}

.ranges-info h4 {
  margin: 20px 0 12px;
  color: var(--brand);
  font-size: 1.1rem;
}

.ranges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.range-card {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 2px solid var(--muted);
  box-shadow: var(--soft-shadow);
}

.range-label {
  display: block;
  font-weight: 700;
  color: var(--brand);
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.range-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.95rem;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: var(--panel);
  border-radius: var(--radius);
  margin-top: 24px;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: var(--muted-text);
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .round-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .ranges-grid {
    grid-template-columns: 1fr;
  }
}
</style>
