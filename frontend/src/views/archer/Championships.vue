<template>
  <main>
    <h1>Championships</h1>
    <p style="color: var(--muted-text); margin-bottom: 24px">
      View club championships and winners
    </p>

    <div class="container-table">
      <div v-if="loading" class="loading">Loading championships...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else-if="championships.length === 0" class="empty-state">
        <p>No championships found</p>
      </div>
      <div v-else class="championships-grid">
        <div
          v-for="championship in championships"
          :key="championship.ChampionshipID"
          class="championship-card"
        >
          <div class="card-header">
            <h3>{{ championship.Name }}</h3>
            <span class="year-badge">{{ championship.Year }}</span>
          </div>
          
          <div class="card-body">
            <div class="info-row">
              <span class="label">📅 Period:</span>
              <span>
                {{ formatDate(championship.StartDate) }} - 
                {{ formatDate(championship.EndDate) }}
              </span>
            </div>
            
            <div class="info-row">
              <span class="label">🏆 Competitions:</span>
              <span>{{ championship.competitions?.length || 0 }}</span>
            </div>
          </div>

          <div class="card-footer">
            <button
              class="btn-primary"
              @click="viewWinners(championship)"
            >
              🏆 View Winners
            </button>
            <button
              class="btn-secondary"
              @click="viewDetails(championship)"
            >
              📋 Details
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedChampionship?.Name }}</h2>
          <button class="close-btn" @click="closeDetailsModal">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedChampionship">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Year:</label>
              <span>{{ selectedChampionship.Year }}</span>
            </div>
            <div class="detail-item">
              <label>Start Date:</label>
              <span>{{ formatDate(selectedChampionship.StartDate) }}</span>
            </div>
            <div class="detail-item">
              <label>End Date:</label>
              <span>{{ formatDate(selectedChampionship.EndDate) }}</span>
            </div>
          </div>

          <div class="competitions-section">
            <h3>Included Competitions</h3>
            <div v-if="selectedChampionship.competitions?.length > 0">
              <div
                v-for="comp in selectedChampionship.competitions"
                :key="comp.CompetitionID"
                class="competition-item"
              >
                <strong>{{ comp.Name }}</strong>
                <span>{{ formatDate(comp.Date) }}</span>
              </div>
            </div>
            <p v-else style="color: var(--muted-text)">
              No competitions linked to this championship
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDetailsModal">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Winners Modal -->
    <div v-if="showWinnersModal" class="modal-overlay" @click="closeWinnersModal">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2>🏆 {{ selectedChampionship?.Name }} - Winners</h2>
          <button class="close-btn" @click="closeWinnersModal">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="loadingWinners" class="loading">
            Loading winners...
          </div>
          <div v-else-if="winnersError" class="error-message">
            {{ winnersError }}
          </div>
          <div v-else-if="Object.keys(winners).length === 0" class="empty-state">
            <p style="font-size: 2rem; margin-bottom: 16px">🏆</p>
            <p style="font-size: 1.2rem; margin-bottom: 8px">No winners data available</p>
            <p style="color: var(--muted-text); margin: 0">
              {{ winners.message || 'This championship may not have any approved scores yet.' }}
            </p>
          </div>
          <div v-else class="winners-container">
            <div
              v-for="(classData, className) in winners"
              :key="className"
              class="class-section"
            >
              <h3 class="class-title">{{ className }}</h3>
              
              <div
                v-for="(divisionWinners, divisionName) in classData"
                :key="divisionName"
                class="division-section"
              >
                <h4 class="division-title">{{ divisionName }}</h4>
                
                <div class="winners-list">
                  <div
                    v-for="(winner, index) in divisionWinners"
                    :key="index"
                    class="winner-card"
                    :class="`rank-${index + 1}`"
                  >
                    <div class="medal">
                      <span v-if="index === 0">🥇</span>
                      <span v-else-if="index === 1">🥈</span>
                      <span v-else-if="index === 2">🥉</span>
                    </div>
                    <div class="winner-info">
                      <div class="rank">#{{ index + 1 }}</div>
                      <div class="name">{{ winner.archerName }}</div>
                      <div class="score">{{ winner.totalScore }} points</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeWinnersModal">
            Close
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/services/api";

const championships = ref([]);
const loading = ref(false);
const error = ref("");

const showDetailsModal = ref(false);
const showWinnersModal = ref(false);
const selectedChampionship = ref(null);
const winners = ref({});
const loadingWinners = ref(false);
const winnersError = ref("");

onMounted(() => {
  loadChampionships();
});

async function loadChampionships() {
  loading.value = true;
  error.value = "";

  try {
    const response = await api.get("/championships");
    championships.value = response.data.championships;
  } catch (err) {
    error.value = err.response?.data?.error || "Failed to load championships";
  } finally {
    loading.value = false;
  }
}

function viewDetails(championship) {
  selectedChampionship.value = championship;
  showDetailsModal.value = true;
}

function closeDetailsModal() {
  showDetailsModal.value = false;
  selectedChampionship.value = null;
}

async function viewWinners(championship) {
  selectedChampionship.value = championship;
  showWinnersModal.value = true;
  loadingWinners.value = true;
  winnersError.value = "";
  winners.value = {};

  try {
    const response = await api.get(`/championships/${championship.ChampionshipID}/winners`);
    winners.value = response.data.winners || {};
  } catch (err) {
    winnersError.value = err.response?.data?.error || "Failed to load winners";
  } finally {
    loadingWinners.value = false;
  }
}

function closeWinnersModal() {
  showWinnersModal.value = false;
  selectedChampionship.value = null;
  winners.value = {};
}

function formatDate(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
</script>

<style scoped>
.championships-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.championship-card {
  background: var(--panel);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.championship-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(17, 17, 17, 0.12);
}

.card-header {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
}

.year-badge {
  background: rgba(255, 255, 255, 0.3);
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.card-body {
  padding: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--muted);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  font-weight: 600;
  color: var(--muted-text);
}

.card-footer {
  padding: 16px 20px;
  background: var(--muted);
  display: flex;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: white;
  color: var(--brand);
  border: 1px solid var(--muted);
}

.btn-secondary:hover {
  background: var(--muted);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: var(--radius);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.modal-content.large {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--muted);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.8rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: var(--brand);
  padding: 0;
  width: 32px;
  height: 32px;
}

.close-btn:hover {
  color: #667eea;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--muted);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item label {
  font-weight: 600;
  color: var(--muted-text);
  font-size: 0.85rem;
  text-transform: uppercase;
}

.detail-item span {
  font-size: 1.1rem;
  color: var(--brand);
}

.competitions-section h3 {
  margin-bottom: 16px;
  color: var(--brand);
}

.competition-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--muted);
  border-radius: 8px;
  margin-bottom: 8px;
}

.competition-item strong {
  color: var(--brand);
}

.competition-item span {
  color: var(--muted-text);
}

.winners-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.class-section {
  background: var(--muted);
  padding: 20px;
  border-radius: var(--radius);
}

.class-title {
  font-size: 1.5rem;
  margin: 0 0 20px;
  color: var(--brand);
  padding-bottom: 12px;
  border-bottom: 2px solid var(--accent);
}

.division-section {
  margin-bottom: 24px;
}

.division-section:last-child {
  margin-bottom: 0;
}

.division-title {
  font-size: 1.2rem;
  margin: 0 0 16px;
  color: #667eea;
  font-weight: 600;
}

.winners-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.winner-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: var(--soft-shadow);
}

.winner-card.rank-1 {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  font-weight: 600;
}

.winner-card.rank-2 {
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
}

.winner-card.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #daa06d 100%);
}

.medal {
  font-size: 2rem;
  flex-shrink: 0;
}

.winner-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}

.rank {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--brand);
  min-width: 40px;
}

.name {
  flex: 1;
  font-size: 1.1rem;
  font-weight: 600;
}

.score {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--muted-text);
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--muted-text);
}

.error-message {
  padding: 16px;
  background: #fee;
  color: #c33;
  border-radius: 8px;
  text-align: center;
}

@media (max-width: 768px) {
  .championships-grid {
    grid-template-columns: 1fr;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 95%;
  }
}
</style>
