<template>
  <main>
    <h1>Archery Rounds</h1>

    <div style="margin-bottom: 24px">
      <div class="container-search">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search rounds..."
          @keyup.enter="filterRounds"
        />
        <button @click="filterRounds">Search</button>
      </div>
    </div>

    <div class="container-table">
      <div v-if="loading" class="loading">Loading rounds...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else-if="filteredRoundsList.length > 0" class="rounds-grid">
        <div
          v-for="round in filteredRoundsList"
          :key="round.RoundID"
          class="round-card"
          @click="viewRound(round)"
        >
          <div class="card-header">
            <h3>{{ round.Name }}</h3>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="label">Max Score:</span>
              <span class="value">{{ round.MaxScore }}</span>
            </div>
            <div class="info-row">
              <span class="label">Arrows:</span>
              <span class="value">{{ round.TotalArrows }}</span>
            </div>
            <div class="info-row">
              <span class="label">Ends:</span>
              <span class="value">{{ round.NumberOfEnds }}</span>
            </div>
            <div class="info-row">
              <span class="label">Arrows per End:</span>
              <span class="value">{{ round.ArrowsPerEnd }}</span>
            </div>
            <div v-if="round.Description" class="description">
              {{ truncate(round.Description, 80) }}
            </div>
          </div>
          <div class="card-footer">
            <button
              class="btn-small btn-primary"
              @click.stop="viewRound(round)"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No rounds found</p>
      </div>
    </div>

    <!-- Round Details Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedRound?.Name }}</h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedRound">
          <div class="round-info">
            <div class="info-section">
              <h3>Round Specifications</h3>
              <div class="info-grid">
                <div class="info-item">
                  <label>Maximum Score:</label>
                  <span class="score-value">{{ selectedRound.MaxScore }}</span>
                </div>
                <div class="info-item">
                  <label>Total Arrows:</label>
                  <span>{{ selectedRound.TotalArrows }}</span>
                </div>
                <div class="info-item">
                  <label>Number of Ends:</label>
                  <span>{{ selectedRound.NumberOfEnds }}</span>
                </div>
                <div class="info-item">
                  <label>Arrows per End:</label>
                  <span>{{ selectedRound.ArrowsPerEnd }}</span>
                </div>
              </div>
            </div>

            <div v-if="selectedRound.Description" class="info-section">
              <h3>Description</h3>
              <div class="description-box">
                <p>{{ selectedRound.Description }}</p>
              </div>
            </div>

            <div class="info-section">
              <h3>Scoring Information</h3>
              <div class="scoring-info">
                <div class="scoring-item">
                  <div class="scoring-label">Perfect End</div>
                  <div class="scoring-value">
                    {{ selectedRound.ArrowsPerEnd * 10 }}
                  </div>
                </div>
                <div class="scoring-item">
                  <div class="scoring-label">Average for Max</div>
                  <div class="scoring-value">
                    {{
                      (
                        selectedRound.MaxScore / selectedRound.TotalArrows
                      ).toFixed(2)
                    }}
                  </div>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h3>Quick Tips</h3>
              <ul class="tips-list">
                <li>
                  Focus on consistency throughout all
                  {{ selectedRound.NumberOfEnds }} ends
                </li>
                <li>Take your time - quality over speed</li>
                <li>Keep track of your arrow calls before scoring</li>
                <li>Review your form between ends</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">Close</button>
          <button class="btn btn-primary" @click="startScoreEntry">
            Enter Score for This Round
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";

const router = useRouter();

const rounds = ref([]);
const loading = ref(false);
const error = ref("");
const searchTerm = ref("");

const showModal = ref(false);
const selectedRound = ref(null);

const filteredRoundsList = computed(() => {
  if (!searchTerm.value) return rounds.value;

  const term = searchTerm.value.toLowerCase();
  return rounds.value.filter(
    (round) =>
      round.Name.toLowerCase().includes(term) ||
      (round.Description && round.Description.toLowerCase().includes(term))
  );
});

onMounted(() => {
  loadRounds();
});

async function loadRounds() {
  loading.value = true;
  error.value = "";

  try {
    const response = await api.get("/rounds");
    rounds.value = response.data.rounds;
  } catch (err) {
    error.value = err.response?.data?.error || "Failed to load rounds";
  } finally {
    loading.value = false;
  }
}

function filterRounds() {
  // Trigger computed property update
}

function viewRound(round) {
  selectedRound.value = round;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedRound.value = null;
}

function startScoreEntry() {
  // Navigate to score entry with pre-selected round
  router.push({
    path: "/archer/score-entry",
    query: { roundId: selectedRound.value.RoundID },
  });
}

function truncate(text, length) {
  if (!text) return "";
  return text.length > length ? text.substring(0, length) + "..." : text;
}
</script>

<style scoped>
.container-search {
  display: flex;
  gap: 12px;
  max-width: 500px;
}

.container-search input {
  flex: 1;
  padding: 12px 16px;
  background: #2d2d2d;
  border: 1px solid #444;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
}

.container-search input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.container-search button {
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.container-search button:hover {
  background: #45a049;
}

.container-table {
  background: #2d2d2d;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #444;
}

.rounds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.round-card {
  background: #1e1e1e;
  border: 1px solid #444;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.round-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.2);
}

.card-header {
  padding: 20px;
  border-bottom: 1px solid #444;
  background: linear-gradient(135deg, #2d2d2d 0%, #252525 100%);
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #ffffff;
  font-weight: 600;
}

.card-body {
  padding: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px;
  background: #252525;
  border-radius: 6px;
}

.info-row .label {
  color: #999;
  font-weight: 500;
  font-size: 13px;
}

.info-row .value {
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
}

.description {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #444;
  color: #cccccc;
  font-size: 13px;
  line-height: 1.5;
}

.card-footer {
  padding: 16px 20px;
  border-top: 1px solid #444;
  background: #252525;
}

.btn-small {
  padding: 8px 16px;
  font-size: 13px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  width: 100%;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: #45a049;
}

.loading,
.error-message,
.empty-state {
  text-align: center;
  padding: 40px;
  color: #ffffff;
}

.error-message {
  color: #dc3545;
}

.empty-state {
  color: #999;
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
  background: #1e1e1e;
  border: 1px solid #444;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
  color: #ffffff;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #444;
  background: linear-gradient(135deg, #2d2d2d 0%, #252525 100%);
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  color: #ffffff;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: #ffffff;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--primary-color);
}

.modal-body {
  padding: 24px;
  color: #ffffff;
}

.round-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-section h3 {
  margin: 0 0 16px 0;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #2d2d2d;
  border-radius: 8px;
  border: 1px solid #444;
}

.info-item label {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
  text-transform: uppercase;
  font-weight: 600;
}

.info-item span {
  font-size: 24px;
  color: #ffffff;
  font-weight: 700;
}

.score-value {
  color: var(--primary-color) !important;
  font-size: 32px !important;
}

.description-box {
  padding: 16px;
  background: #2d2d2d;
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
}

.description-box p {
  margin: 0;
  color: #cccccc;
  line-height: 1.6;
}

.scoring-info {
  display: flex;
  gap: 16px;
  justify-content: space-around;
}

.scoring-item {
  flex: 1;
  text-align: center;
  padding: 20px;
  background: #2d2d2d;
  border-radius: 8px;
  border: 1px solid #444;
}

.scoring-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
  text-transform: uppercase;
  font-weight: 600;
}

.scoring-value {
  font-size: 32px;
  color: var(--primary-color);
  font-weight: 700;
}

.tips-list {
  margin: 0;
  padding-left: 24px;
}

.tips-list li {
  color: #cccccc;
  line-height: 2;
  margin-bottom: 8px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #444;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}
</style>
