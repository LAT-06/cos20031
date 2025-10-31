<template>
  <main>
    <h1>Eligible Rounds</h1>
    <p style="color: var(--muted-text); margin-bottom: 24px">
      View rounds you are eligible to shoot based on your class
    </p>

    <div v-if="loading" class="loading">Loading eligible rounds...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else>
      <!-- Archer Info -->
      <div class="info-card" v-if="archerInfo">
        <h3>👤 {{ archerInfo.name }}</h3>
        <p><strong>Class:</strong> {{ archerInfo.class }}</p>
        <p><strong>Eligible Rounds:</strong> {{ totalRounds }} rounds available</p>
      </div>

      <!-- No rounds message -->
      <div v-if="eligibleRounds.length === 0" class="empty-state">
        <p style="font-size: 2rem; margin-bottom: 16px">🎯</p>
        <p style="font-size: 1.2rem; margin-bottom: 8px">No eligible rounds found</p>
        <p style="color: var(--muted-text)">
          Contact your administrator to set up equivalent rounds for your class
        </p>
      </div>

      <!-- Rounds List -->
      <div v-else class="rounds-container">
        <div
          v-for="(roundGroup, index) in eligibleRounds"
          :key="index"
          class="round-group"
        >
          <div class="base-round">
            <div class="round-header">
              <h3>🎯 {{ roundGroup.baseRound.Name }}</h3>
              <span class="category-badges">
                <span
                  v-for="category in roundGroup.categories"
                  :key="category"
                  class="category-badge"
                >
                  {{ category }}
                </span>
              </span>
            </div>
            
            <p v-if="roundGroup.baseRound.Description" class="description">
              {{ roundGroup.baseRound.Description }}
            </p>

            <div class="ranges-info">
              <h4>Base Round Details:</h4>
              <div class="ranges-grid">
                <div
                  v-for="range in roundGroup.baseRound.ranges"
                  :key="range.RoundRangeID"
                  class="range-card"
                >
                  <span class="range-label">Range {{ range.RangeNo }}</span>
                  <div class="range-details">
                    <span>📏 {{ range.Distance }}m</span>
                    <span>🎯 {{ range.TargetFace }}</span>
                    <span>🔁 {{ range.Ends }} ends</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Equivalent Rounds -->
          <div v-if="roundGroup.equivalentRounds.length > 0" class="equivalent-rounds">
            <h4>✨ Alternative Equivalent Rounds:</h4>
            <div class="equivalent-list">
              <div
                v-for="eqRound in roundGroup.equivalentRounds"
                :key="eqRound.RoundID"
                class="equivalent-card"
              >
                <div class="eq-header">
                  <strong>{{ eqRound.Name }}</strong>
                  <span class="eq-category">{{ eqRound.category }}</span>
                </div>
                <p v-if="eqRound.Description" class="eq-description">
                  {{ eqRound.Description }}
                </p>
                <div class="eq-ranges">
                  <div
                    v-for="range in eqRound.ranges"
                    :key="range.RoundRangeID"
                    class="eq-range"
                  >
                    <span>Range {{ range.RangeNo }}:</span>
                    <span>{{ range.Distance }}m, {{ range.TargetFace }}, {{ range.Ends }} ends</span>
                  </div>
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
const archerInfo = ref(null);
const eligibleRounds = ref([]);
const totalRounds = ref(0);

onMounted(() => {
  loadEligibleRounds();
});

async function loadEligibleRounds() {
  loading.value = true;
  error.value = "";

  try {
    const archerId = authStore.user?.ArcherID;
    if (!archerId) {
      error.value = "Archer ID not found";
      return;
    }

    const response = await api.get(`/archers/${archerId}/eligible-rounds`);
    
    archerInfo.value = response.data.archer;
    eligibleRounds.value = response.data.eligibleRounds || [];
    totalRounds.value = response.data.totalRounds || 0;

    if (response.data.message) {
      error.value = response.data.message;
    }
  } catch (err) {
    console.error("Load eligible rounds error:", err);
    error.value = err.message || "Failed to load eligible rounds";
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
  gap: 32px;
}

.round-group {
  background: var(--panel);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.base-round {
  padding: 24px;
  background: linear-gradient(to bottom, #f8f9ff 0%, white 100%);
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

.category-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.category-badge {
  background: #667eea;
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 600;
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

.equivalent-rounds {
  padding: 24px;
  background: var(--muted);
  border-top: 3px solid #667eea;
}

.equivalent-rounds h4 {
  margin: 0 0 16px;
  color: #667eea;
  font-size: 1.2rem;
}

.equivalent-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.equivalent-card {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: var(--soft-shadow);
  border-left: 4px solid #667eea;
}

.eq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.eq-header strong {
  color: var(--brand);
  font-size: 1.1rem;
}

.eq-category {
  background: #e8ecff;
  color: #667eea;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.eq-description {
  color: var(--muted-text);
  font-size: 0.9rem;
  margin-bottom: 12px;
  font-style: italic;
}

.eq-ranges {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
}

.eq-range {
  display: flex;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--muted);
}

.eq-range:last-child {
  border-bottom: none;
}

.eq-range span:first-child {
  font-weight: 600;
  min-width: 80px;
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

  .ranges-grid,
  .equivalent-list {
    grid-template-columns: 1fr;
  }
}
</style>
