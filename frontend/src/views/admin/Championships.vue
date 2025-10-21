<template>
  <main>
    <h1>Championships Management</h1>

    <div style="margin-bottom: 24px">
      <div class="container-search">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search championships..."
          @keyup.enter="loadChampionships"
        />
        <button @click="loadChampionships">Search</button>
      </div>

      <div class="container-add">
        <button @click="openAddModal">+ Add Championship</button>
      </div>
    </div>

    <div class="container-table">
      <div v-if="loading" class="loading">Loading championships...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <table v-else>
        <thead>
          <tr>
            <th>Name</th>
            <th>Year</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Competitions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="champ in championships" :key="champ.ChampionshipID">
            <td><strong>{{ champ.Name }}</strong></td>
            <td>{{ champ.Year }}</td>
            <td>{{ formatDate(champ.StartDate) }}</td>
            <td>{{ formatDate(champ.EndDate) }}</td>
            <td>{{ champ.competitions?.length || 0 }} competition(s)</td>
            <td>
              <button class="btn-small btn-info" @click="viewChampionship(champ)">View</button>
              <button class="btn-small btn-warning" @click="editChampionship(champ)">Edit</button>
              <button 
                class="btn-small btn-danger" 
                @click="deleteChampionship(champ)" 
                v-if="authStore.isAdmin"
              >
                Delete
              </button>
            </td>
          </tr>
          <tr v-if="championships.length === 0">
            <td colspan="6" style="text-align: center; padding: 40px;">
              No championships found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- View Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click="closeViewModal">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2>Championship Details</h2>
          <button class="close-btn" @click="closeViewModal">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedChampionship">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Name:</label>
              <span>{{ selectedChampionship.Name }}</span>
            </div>
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
            <div class="detail-item" style="grid-column: 1 / -1;">
              <label>Description:</label>
              <span>{{ selectedChampionship.Description || 'N/A' }}</span>
            </div>
          </div>

          <div v-if="selectedChampionship.competitions && selectedChampionship.competitions.length > 0" class="competitions-section">
            <h3>Linked Competitions</h3>
            <div class="competition-list">
              <div v-for="comp in selectedChampionship.competitions" :key="comp.CompetitionID" class="competition-card">
                <div class="comp-name">{{ comp.Name }}</div>
                <div class="comp-details">
                  <span>{{ formatDate(comp.Date) }}</span>
                  <span class="separator">•</span>
                  <span>{{ comp.Location || 'N/A' }}</span>
                  <span class="separator">•</span>
                  <span :class="`badge badge-${comp.Status}`">{{ comp.Status }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeViewModal">Close</button>
          <button class="btn btn-primary" @click="editChampionship(selectedChampionship)">Edit</button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showFormModal" class="modal-overlay" @click="closeFormModal">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditMode ? 'Edit' : 'Add' }} Championship</h2>
          <button class="close-btn" @click="closeFormModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveChampionship">
            <div class="form-group">
              <label for="name">Championship Name *</label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                required
                placeholder="e.g., 2025 Club Championship"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="year">Year *</label>
                <input
                  id="year"
                  v-model.number="formData.year"
                  type="number"
                  required
                  min="2000"
                  max="2100"
                />
              </div>
              <div class="form-group">
                <label for="startDate">Start Date *</label>
                <input
                  id="startDate"
                  v-model="formData.startDate"
                  type="date"
                  required
                />
              </div>
              <div class="form-group">
                <label for="endDate">End Date *</label>
                <input
                  id="endDate"
                  v-model="formData.endDate"
                  type="date"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea
                id="description"
                v-model="formData.description"
                rows="3"
                placeholder="Optional description"
              ></textarea>
            </div>

            <div class="form-group">
              <label>Link Competitions (Optional)</label>
              <div class="competitions-checkboxes">
                <div v-for="comp in availableCompetitions" :key="comp.CompetitionID" class="checkbox-item">
                  <input
                    type="checkbox"
                    :id="`comp-${comp.CompetitionID}`"
                    :value="comp.CompetitionID"
                    v-model="formData.competitionIds"
                  />
                  <label :for="`comp-${comp.CompetitionID}`">
                    {{ comp.Name }} ({{ formatDate(comp.Date) }})
                  </label>
                </div>
                <div v-if="availableCompetitions.length === 0" class="no-competitions">
                  No competitions available. Create competitions first.
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

const championships = ref([]);
const availableCompetitions = ref([]);
const loading = ref(false);
const error = ref('');
const searchTerm = ref('');

// Modals
const showViewModal = ref(false);
const showFormModal = ref(false);
const selectedChampionship = ref(null);
const isEditMode = ref(false);

// Form
const formData = ref({
  name: '',
  year: new Date().getFullYear(),
  startDate: '',
  endDate: '',
  description: '',
  competitionIds: []
});
const formLoading = ref(false);
const formError = ref('');

onMounted(() => {
  loadChampionships();
  loadCompetitions();
});

async function loadChampionships() {
  loading.value = true;
  error.value = '';

  try {
    const params = {};
    if (searchTerm.value) params.search = searchTerm.value;

    const response = await api.get('/championships', { params });
    championships.value = response.data.championships;
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load championships';
  } finally {
    loading.value = false;
  }
}

async function loadCompetitions() {
  try {
    const response = await api.get('/competitions');
    availableCompetitions.value = response.data.competitions;
  } catch (err) {
    console.error('Failed to load competitions:', err);
  }
}

function openAddModal() {
  isEditMode.value = false;
  const now = new Date();
  formData.value = {
    name: '',
    year: now.getFullYear(),
    startDate: now.toISOString().split('T')[0],
    endDate: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0],
    description: '',
    competitionIds: []
  };
  formError.value = '';
  showFormModal.value = true;
}

function viewChampionship(champ) {
  selectedChampionship.value = champ;
  showViewModal.value = true;
}

function editChampionship(champ) {
  isEditMode.value = true;
  selectedChampionship.value = champ;
  formData.value = {
    name: champ.Name,
    year: champ.Year,
    startDate: champ.StartDate,
    endDate: champ.EndDate,
    description: champ.Description || '',
    competitionIds: champ.competitions?.map(c => c.CompetitionID) || []
  };
  formError.value = '';
  showViewModal.value = false;
  showFormModal.value = true;
}

async function saveChampionship() {
  formLoading.value = true;
  formError.value = '';

  try {
    const payload = {
      name: formData.value.name,
      year: formData.value.year,
      startDate: formData.value.startDate,
      endDate: formData.value.endDate,
      description: formData.value.description,
      competitionIds: formData.value.competitionIds
    };

    if (isEditMode.value) {
      await api.put(`/championships/${selectedChampionship.value.ChampionshipID}`, payload);
    } else {
      await api.post('/championships', payload);
    }

    await loadChampionships();
    closeFormModal();
  } catch (err) {
    formError.value = err.response?.data?.error || `Failed to ${isEditMode.value ? 'update' : 'create'} championship`;
  } finally {
    formLoading.value = false;
  }
}

async function deleteChampionship(champ) {
  if (!confirm(`Are you sure you want to delete "${champ.Name}"?\n\nThis cannot be undone.`)) {
    return;
  }

  try {
    await api.delete(`/championships/${champ.ChampionshipID}`);
    await loadChampionships();
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to delete championship');
  }
}

function closeViewModal() {
  showViewModal.value = false;
  selectedChampionship.value = null;
}

function closeFormModal() {
  showFormModal.value = false;
  selectedChampionship.value = null;
  formError.value = '';
}

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
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

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
  color: #aaaaaa;
  font-size: 14px;
}

.detail-item span {
  font-size: 16px;
  color: #ffffff;
}

.competitions-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid var(--border-color);
}

.competitions-section h3 {
  margin-bottom: 16px;
  color: #ffffff;
}

.competition-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.competition-card {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 16px;
}

.comp-name {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 16px;
  color: #ffffff;
}

.comp-details {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #aaaaaa;
}

.separator {
  color: var(--border-color);
}

.competitions-checkboxes {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 4px;
}

.checkbox-item:hover {
  background: var(--background-color);
}

.checkbox-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-item label {
  cursor: pointer;
  flex: 1;
  margin: 0;
  color: #ffffff;
}

.no-competitions {
  text-align: center;
  padding: 20px;
  color: #aaaaaa;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
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

.badge-upcoming {
  background: #17a2b8;
}

.badge-ongoing {
  background: #28a745;
}

.badge-completed {
  background: #6c757d;
}

.badge-cancelled {
  background: #dc3545;
}

@media (max-width: 768px) {
  .detail-grid,
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
