<template>
  <main>
    <h1>Competitions</h1>

    <div style="margin-bottom: 24px">
      <div class="container-filter">
        <select v-model="filterStatus" @change="loadCompetitions">
          <option value="">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </div>

    <div class="container-table">
      <div v-if="loading" class="loading">Loading competitions...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else-if="competitions.length > 0" class="competitions-grid">
        <div
          v-for="comp in competitions"
          :key="comp.CompetitionID"
          class="competition-card"
          @click="viewCompetition(comp)"
        >
          <div class="card-header">
            <h3>{{ comp.Name }}</h3>
            <span :class="`badge badge-${comp.Status}`">{{ comp.Status }}</span>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="label">Start Date:</span>
              <span>{{ formatDate(comp.StartDate) }}</span>
            </div>
            <div class="info-row">
              <span class="label">End Date:</span>
              <span>{{ formatDate(comp.EndDate) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Location:</span>
              <span>{{ comp.Location || "TBA" }}</span>
            </div>
            <div v-if="comp.Description" class="description">
              {{ truncate(comp.Description, 100) }}
            </div>
          </div>
          <div class="card-footer">
            <button
              class="btn-small btn-primary"
              @click.stop="viewCompetition(comp)"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No competitions found</p>
      </div>
    </div>

    <!-- Competition Details Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedCompetition?.Name }}</h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedCompetition">
          <div class="competition-info">
            <div class="info-section">
              <h3>Competition Details</h3>
              <div class="info-grid">
                <div class="info-item">
                  <label>Status:</label>
                  <span :class="`badge badge-${selectedCompetition.Status}`">
                    {{ selectedCompetition.Status }}
                  </span>
                </div>
                <div class="info-item">
                  <label>Start Date:</label>
                  <span>{{ formatDate(selectedCompetition.StartDate) }}</span>
                </div>
                <div class="info-item">
                  <label>End Date:</label>
                  <span>{{ formatDate(selectedCompetition.EndDate) }}</span>
                </div>
                <div class="info-item">
                  <label>Location:</label>
                  <span>{{ selectedCompetition.Location || "TBA" }}</span>
                </div>
              </div>

              <div
                v-if="selectedCompetition.Description"
                class="description-full"
              >
                <h4>Description</h4>
                <p>{{ selectedCompetition.Description }}</p>
              </div>
            </div>

            <div v-if="competitionScores.length > 0" class="info-section">
              <h3>Leaderboard</h3>
              <table class="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Archer</th>
                    <th>Division</th>
                    <th>Round</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(score, index) in competitionScores"
                    :key="score.ScoreRecordID"
                    :class="{
                      'my-score': score.ArcherID === authStore.user.id,
                    }"
                  >
                    <td class="rank">{{ index + 1 }}</td>
                    <td>
                      {{ score.archer.FirstName }} {{ score.archer.LastName }}
                    </td>
                    <td>{{ score.division?.Name || "N/A" }}</td>
                    <td>{{ score.round.Name }}</td>
                    <td>
                      <strong>{{ score.TotalScore }}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-state">
              <p>No scores submitted yet for this competition</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">Close</button>
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

const competitions = ref([]);
const loading = ref(false);
const error = ref("");
const filterStatus = ref("");

const showModal = ref(false);
const selectedCompetition = ref(null);
const competitionScores = ref([]);

onMounted(() => {
  loadCompetitions();
});

async function loadCompetitions() {
  loading.value = true;
  error.value = "";

  try {
    const params = {};
    if (filterStatus.value) params.status = filterStatus.value;

    const response = await api.get("/competitions", { params });
    competitions.value = response.data.competitions;
  } catch (err) {
    error.value = err.response?.data?.error || "Failed to load competitions";
  } finally {
    loading.value = false;
  }
}

async function viewCompetition(competition) {
  selectedCompetition.value = competition;

  // Load scores for this competition
  try {
    const response = await api.get("/scores", {
      params: {
        competitionId: competition.CompetitionID,
        status: "approved",
      },
    });
    // Sort by TotalScore descending
    competitionScores.value = response.data.scores.sort(
      (a, b) => b.TotalScore - a.TotalScore
    );
  } catch (err) {
    console.error("Failed to load competition scores:", err);
    competitionScores.value = [];
  }

  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedCompetition.value = null;
  competitionScores.value = [];
}

function formatDate(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function truncate(text, length) {
  if (!text) return "";
  return text.length > length ? text.substring(0, length) + "..." : text;
}
</script>

<style scoped>
.container-filter {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.container-filter select {
  padding: 10px 16px;
  background: #2d2d2d;
  border: 1px solid #444;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
}

.container-filter select:hover {
  border-color: var(--primary-color);
}

.container-table {
  background: #2d2d2d;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #444;
}

.competitions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.competition-card {
  background: #1e1e1e;
  border: 1px solid #444;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.competition-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.2);
}

.card-header {
  padding: 20px;
  border-bottom: 1px solid #444;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #ffffff;
  flex: 1;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
  margin-left: 12px;
}

.badge-upcoming {
  background: #17a2b8;
  color: white;
}

.badge-active {
  background: #28a745;
  color: white;
}

.badge-completed {
  background: #6c757d;
  color: white;
}

.card-body {
  padding: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #ffffff;
}

.info-row .label {
  color: #999;
  font-weight: 500;
}

.description {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #444;
  color: #cccccc;
  font-size: 14px;
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
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
  color: #ffffff;
}

.modal-content.large {
  max-width: 1000px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #444;
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

.competition-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-section h3 {
  margin: 0 0 16px 0;
  color: #ffffff;
  font-size: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: #2d2d2d;
  border-radius: 8px;
}

.info-item label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.info-item span {
  font-size: 16px;
  color: #ffffff;
  font-weight: 500;
}

.description-full {
  padding: 16px;
  background: #2d2d2d;
  border-radius: 8px;
}

.description-full h4 {
  margin: 0 0 12px 0;
  color: #ffffff;
  font-size: 14px;
  text-transform: uppercase;
}

.description-full p {
  margin: 0;
  color: #cccccc;
  line-height: 1.6;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  background: #2d2d2d;
  border-radius: 8px;
  overflow: hidden;
}

.leaderboard-table th {
  text-align: left;
  padding: 12px;
  background: #252525;
  border-bottom: 2px solid #444;
  font-weight: 600;
  color: #ffffff;
  font-size: 14px;
  text-transform: uppercase;
}

.leaderboard-table td {
  padding: 12px;
  border-bottom: 1px solid #333;
  color: #ffffff;
}

.leaderboard-table tr:hover {
  background: #363636;
}

.leaderboard-table tr.my-score {
  background: rgba(76, 175, 80, 0.1);
  border-left: 4px solid var(--primary-color);
}

.leaderboard-table .rank {
  font-weight: 700;
  color: var(--primary-color);
  font-size: 18px;
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
