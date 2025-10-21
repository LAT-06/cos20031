<template>
  <main>
    <h1>Rounds Management</h1>

    <div style="margin-bottom: 24px">
      <div class="container-search">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search rounds..."
          @keyup.enter="loadRounds"
        />
        <button @click="loadRounds">Search</button>
      </div>

      <div class="container-add">
        <button @click="openAddModal">+ Add Round</button>
      </div>
    </div>

    <div class="container-table">
      <div v-if="loading" class="loading">Loading rounds...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <table v-else>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Ranges</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="round in rounds" :key="round.RoundID">
            <td><strong>{{ round.Name }}</strong></td>
            <td>{{ round.Description || 'N/A' }}</td>
            <td>{{ round.ranges?.length || 0 }} range(s)</td>
            <td>
              <button class="btn-small btn-info" @click="viewRound(round)">View</button>
              <button class="btn-small btn-warning" @click="editRound(round)">Edit</button>
              <button 
                class="btn-small btn-danger" 
                @click="deleteRound(round)" 
                v-if="authStore.isAdmin"
              >
                Delete
              </button>
            </td>
          </tr>
          <tr v-if="rounds.length === 0">
            <td colspan="4" style="text-align: center; padding: 40px;">
              No rounds found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- View Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click="closeViewModal">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2>Round Details</h2>
          <button class="close-btn" @click="closeViewModal">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedRound">
          <div class="detail-item">
            <label>Name:</label>
            <span>{{ selectedRound.Name }}</span>
          </div>
          <div class="detail-item" style="margin-top: 16px">
            <label>Description:</label>
            <span>{{ selectedRound.Description || 'N/A' }}</span>
          </div>

          <div v-if="selectedRound.ranges && selectedRound.ranges.length > 0" class="ranges-section">
            <h3>Ranges Configuration</h3>
            <div v-for="(range, index) in selectedRound.ranges" :key="range.RoundRangeID" class="range-card">
              <h4>Range {{ index + 1 }}</h4>
              <div class="range-details">
                <div><strong>Distance:</strong> {{ range.Distance }} {{ range.Unit }}</div>
                <div><strong>Target Size:</strong> {{ range.TargetSize }}cm</div>
                <div><strong>Scoring:</strong> {{ range.ScoringType }}</div>
                <div><strong>Ends:</strong> {{ range.NumEnds }}</div>
                <div><strong>Arrows per End:</strong> {{ range.ArrowsPerEnd }}</div>
                <div><strong>Total Arrows:</strong> {{ range.NumEnds * range.ArrowsPerEnd }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeViewModal">Close</button>
          <button class="btn btn-primary" @click="editRound(selectedRound)">Edit</button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showFormModal" class="modal-overlay" @click="closeFormModal">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditMode ? 'Edit' : 'Add' }} Round</h2>
          <button class="close-btn" @click="closeFormModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveRound">
            <div class="form-group">
              <label for="name">Round Name *</label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                required
                placeholder="e.g., WA 1440"
              />
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea
                id="description"
                v-model="formData.description"
                rows="3"
                placeholder="Optional description of the round"
              ></textarea>
            </div>

            <div class="ranges-form-section">
              <div class="section-header">
                <h3>Ranges Configuration</h3>
                <button type="button" class="btn btn-small" @click="addRange">+ Add Range</button>
              </div>

              <div v-for="(range, index) in formData.ranges" :key="index" class="range-form-card">
                <div class="range-header">
                  <h4>Range {{ index + 1 }}</h4>
                  <button type="button" class="btn-icon" @click="removeRange(index)" v-if="formData.ranges.length > 1">
                    &times;
                  </button>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Distance *</label>
                    <input v-model.number="range.distance" type="number" required min="1" />
                  </div>
                  <div class="form-group">
                    <label>Unit *</label>
                    <select v-model="range.unit" required>
                      <option value="meters">Meters</option>
                      <option value="yards">Yards</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Target Size (cm) *</label>
                    <input v-model.number="range.targetSize" type="number" required min="1" />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Scoring Type *</label>
                    <select v-model="range.scoringType" required>
                      <option value="10-zone">10-zone</option>
                      <option value="5-zone">5-zone</option>
                      <option value="Imperial">Imperial</option>
                      <option value="Worcester">Worcester</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Number of Ends *</label>
                    <input v-model.number="range.numEnds" type="number" required min="1" />
                  </div>
                  <div class="form-group">
                    <label>Arrows per End *</label>
                    <input v-model.number="range.arrowsPerEnd" type="number" required min="1" max="12" />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="formError" class="error-message">{{ formError }}</div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeFormModal">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="formLoading">
                {{ formLoading ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';

const authStore = useAuthStore();

const rounds = ref([]);
const loading = ref(false);
const error = ref('');
const searchTerm = ref('');

// Modals
const showViewModal = ref(false);
const showFormModal = ref(false);
const selectedRound = ref(null);
const isEditMode = ref(false);

// Form
const formData = ref({
  name: '',
  description: '',
  ranges: [{
    distance: 70,
    unit: 'meters',
    targetSize: 122,
    scoringType: '10-zone',
    numEnds: 12,
    arrowsPerEnd: 6
  }]
});
const formLoading = ref(false);
const formError = ref('');

onMounted(() => {
  loadRounds();
});

async function loadRounds() {
  loading.value = true;
  error.value = '';

  try {
    const params = {};
    if (searchTerm.value) params.search = searchTerm.value;

    const response = await api.get('/rounds', { params });
    rounds.value = response.data.rounds;
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load rounds';
  } finally {
    loading.value = false;
  }
}

function openAddModal() {
  isEditMode.value = false;
  formData.value = {
    name: '',
    description: '',
    ranges: [{
      distance: 70,
      unit: 'meters',
      targetSize: 122,
      scoringType: '10-zone',
      numEnds: 12,
      arrowsPerEnd: 6
    }]
  };
  formError.value = '';
  showFormModal.value = true;
}

function viewRound(round) {
  selectedRound.value = round;
  showViewModal.value = true;
}

function editRound(round) {
  isEditMode.value = true;
  selectedRound.value = round;
  formData.value = {
    name: round.Name,
    description: round.Description || '',
    ranges: round.ranges?.map(r => ({
      distance: r.Distance,
      unit: r.Unit,
      targetSize: r.TargetSize,
      scoringType: r.ScoringType,
      numEnds: r.NumEnds,
      arrowsPerEnd: r.ArrowsPerEnd
    })) || [{
      distance: 70,
      unit: 'meters',
      targetSize: 122,
      scoringType: '10-zone',
      numEnds: 12,
      arrowsPerEnd: 6
    }]
  };
  formError.value = '';
  showViewModal.value = false;
  showFormModal.value = true;
}

async function saveRound() {
  formLoading.value = true;
  formError.value = '';

  try {
    const payload = {
      name: formData.value.name,
      description: formData.value.description,
      ranges: formData.value.ranges.map(r => ({
        distance: r.distance,
        unit: r.unit,
        targetSize: r.targetSize,
        scoringType: r.scoringType,
        numEnds: r.numEnds,
        arrowsPerEnd: r.arrowsPerEnd
      }))
    };

    if (isEditMode.value) {
      await api.put(`/rounds/${selectedRound.value.RoundID}`, payload);
    } else {
      await api.post('/rounds', payload);
    }

    await loadRounds();
    closeFormModal();
  } catch (err) {
    formError.value = err.response?.data?.error || `Failed to ${isEditMode.value ? 'update' : 'create'} round`;
  } finally {
    formLoading.value = false;
  }
}

async function deleteRound(round) {
  if (!confirm(`Are you sure you want to delete the round "${round.Name}"?\n\nThis cannot be undone.`)) {
    return;
  }

  try {
    await api.delete(`/rounds/${round.RoundID}`);
    await loadRounds();
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to delete round');
  }
}

function addRange() {
  formData.value.ranges.push({
    distance: 70,
    unit: 'meters',
    targetSize: 122,
    scoringType: '10-zone',
    numEnds: 12,
    arrowsPerEnd: 6
  });
}

function removeRange(index) {
  formData.value.ranges.splice(index, 1);
}

function closeViewModal() {
  showViewModal.value = false;
  selectedRound.value = null;
}

function closeFormModal() {
  showFormModal.value = false;
  selectedRound.value = null;
  formError.value = '';
}
</script>

<style scoped>
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
  color: #ffffff;
}

.modal-content.large {
  max-width: 800px;
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

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #444;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item label {
  font-weight: 600;
  color: #aaaaaa;
  font-size: 14px;
}

.detail-item span {
  font-size: 16px;
  color: #ffffff;
}

.ranges-section {
  margin-top: 24px;
}

.ranges-section h3 {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #444;
  color: #ffffff;
}

.range-card {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.range-card h4 {
  margin: 0 0 12px 0;
  color: var(--primary-color);
}

.range-details div {
  color: #ffffff;
}

.range-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.ranges-form-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid var(--border-color);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  color: #ffffff;
}

.range-form-card {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.range-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.range-header h4 {
  margin: 0;
  color: #ffffff;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--danger-color, #dc3545);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: rgba(220, 53, 69, 0.1);
  border-radius: 4px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.btn-small {
  padding: 6px 12px;
  font-size: 14px;
  margin-right: 8px;
}

.btn-info {
  background: #17a2b8;
}

.btn-warning {
  background: #ffc107;
  color: #000;
}

.btn-danger {
  background: #dc3545;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .range-details {
    grid-template-columns: 1fr;
  }
}
</style>
