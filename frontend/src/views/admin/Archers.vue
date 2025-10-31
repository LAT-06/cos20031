<template>
  <main>
    <h1>Archers Management</h1>

    <div style="margin-bottom: 24px">
      <div class="container-search">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search archers..."
          @keyup.enter="loadArchers"
        />
        <button @click="loadArchers">Search</button>
      </div>

      <div class="container-filter">
        <select v-model="filterRole" @change="loadArchers">
          <option value="">All Roles</option>
          <option value="archer">Archer</option>
          <option value="recorder">Recorder</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div class="container-add">
        <button @click="openAddModal">+ Add Archer</button>
      </div>
    </div>

    <div class="container-table">
      <div v-if="loading" class="loading">Loading archers...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <table v-else>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Gender</th>
            <th>Class</th>
            <th>Division</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="archer in archers" :key="archer.ArcherID">
            <td>{{ archer.FirstName }} {{ archer.LastName }}</td>
            <td>{{ archer.Email }}</td>
            <td>{{ archer.Gender }}</td>
            <td>{{ archer.class?.Name || "N/A" }}</td>
            <td :style="archer.Role !== 'archer' ? 'opacity: 0.3' : ''">
              {{
                archer.Role === "archer"
                  ? archer.defaultDivision?.Name || "N/A"
                  : "-"
              }}
            </td>
            <td>
              <span :class="`badge badge-${archer.Role}`">{{
                archer.Role
              }}</span>
            </td>
            <td>
              <button class="btn-small btn-info" @click="viewArcher(archer)">
                View
              </button>
              <button class="btn-small btn-warning" @click="editArcher(archer)">
                Edit
              </button>
              <button
                class="btn-small btn-danger"
                @click="deleteArcher(archer)"
                v-if="authStore.isAdmin"
                title="Only admins can delete archers"
              >
                Delete
              </button>
            </td>
          </tr>
          <tr v-if="archers.length === 0">
            <td colspan="7" style="text-align: center; padding: 40px">
              No archers found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- View Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click="closeViewModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Archer Details</h2>
          <button class="close-btn" @click="closeViewModal">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedArcher">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Full Name:</label>
              <span
                >{{ selectedArcher.FirstName }}
                {{ selectedArcher.LastName }}</span
              >
            </div>
            <div class="detail-item">
              <label>Email:</label>
              <span>{{ selectedArcher.Email }}</span>
            </div>
            <div class="detail-item">
              <label>Date of Birth:</label>
              <span>{{ formatDate(selectedArcher.DateOfBirth) }}</span>
            </div>
            <div class="detail-item">
              <label>Gender:</label>
              <span>{{ selectedArcher.Gender }}</span>
            </div>
            <div class="detail-item">
              <label>Class:</label>
              <span>{{ selectedArcher.class?.Name || "N/A" }}</span>
            </div>
            <div class="detail-item">
              <label>Default Division:</label>
              <span v-if="selectedArcher.Role === 'archer'">
                {{ selectedArcher.defaultDivision?.Name || "N/A" }}
              </span>
              <span v-else style="opacity: 0.5"> - </span>
            </div>
            <div class="detail-item">
              <label>Role:</label>
              <span :class="`badge badge-${selectedArcher.Role}`">{{
                selectedArcher.Role
              }}</span>
            </div>
            <div class="detail-item">
              <label>Archer ID:</label>
              <span>{{ selectedArcher.ArcherID }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeViewModal">
            Close
          </button>
          <button class="btn btn-primary" @click="editArcher(selectedArcher)">
            Edit
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showFormModal" class="modal-overlay" @click="closeFormModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditMode ? "Edit" : "Add" }} Archer</h2>
          <button class="close-btn" @click="closeFormModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveArcher">
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">First Name *</label>
                <input
                  id="firstName"
                  v-model="formData.firstName"
                  type="text"
                  required
                  placeholder="John"
                />
              </div>
              <div class="form-group">
                <label for="lastName">Last Name *</label>
                <input
                  id="lastName"
                  v-model="formData.lastName"
                  type="text"
                  required
                  placeholder="Doe"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email *</label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                required
                :disabled="isEditMode"
                placeholder="john.doe@email.com"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="dateOfBirth">Date of Birth *</label>
                <input
                  id="dateOfBirth"
                  v-model="formData.dateOfBirth"
                  type="date"
                  required
                />
              </div>
              <div class="form-group">
                <label for="gender">Gender *</label>
                <select id="gender" v-model="formData.gender" required>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="role">Role *</label>
                <select id="role" v-model="formData.role" required>
                  <option value="archer">Archer</option>
                  <option value="recorder" v-if="authStore.isAdmin">
                    Recorder
                  </option>
                  <option value="admin" v-if="authStore.isAdmin">Admin</option>
                </select>
                <small v-if="!authStore.isAdmin" style="color: #aaaaaa">
                  Only admins can assign recorder/admin roles
                </small>
              </div>
              <div class="form-group" v-if="formData.role === 'archer'">
                <label for="defaultDivisionId">Default Division</label>
                <select
                  id="defaultDivisionId"
                  v-model="formData.defaultDivisionId"
                >
                  <option value="">None</option>
                  <option
                    v-for="division in divisions"
                    :key="division.DivisionID"
                    :value="division.DivisionID"
                  >
                    {{ division.Name }}
                  </option>
                </select>
                <small style="color: #aaaaaa">
                  Division/equipment type for this archer
                </small>
              </div>
              <div
                v-else
                style="
                  padding: 10px;
                  background: #2d2d2d;
                  border-radius: 4px;
                  margin-bottom: 1rem;
                "
              >
                <small style="color: #aaaaaa">
                  ℹ️ Default Division is only applicable for archers
                </small>
              </div>
            </div>

            <div class="form-group" v-if="!isEditMode">
              <label for="password">Password *</label>
              <input
                id="password"
                v-model="formData.password"
                type="password"
                :required="!isEditMode"
                minlength="8"
                placeholder="Minimum 8 characters"
              />
              <small style="color: var(--muted-text)">
                Minimum 8 characters
              </small>
            </div>

            <div class="form-group" v-if="isEditMode">
              <label for="newPassword">New Password (optional)</label>
              <input
                id="newPassword"
                v-model="formData.password"
                type="password"
                minlength="8"
                placeholder="Leave blank to keep current password"
              />
              <small style="color: var(--muted-text)">
                Leave blank to keep current password
              </small>
            </div>

            <div v-if="formError" class="error-message">{{ formError }}</div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                @click="closeFormModal"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="formLoading"
              >
                {{
                  formLoading ? "Saving..." : isEditMode ? "Update" : "Create"
                }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";

const authStore = useAuthStore();

const archers = ref([]);
const divisions = ref([]);
const loading = ref(false);
const error = ref("");
const searchTerm = ref("");
const filterRole = ref("");

// Modals
const showViewModal = ref(false);
const showFormModal = ref(false);
const selectedArcher = ref(null);
const isEditMode = ref(false);

// Form
const formData = ref({
  firstName: "",
  lastName: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  role: "archer",
  defaultDivisionId: "",
  password: "",
});
const formLoading = ref(false);
const formError = ref("");

// Watch role changes to clear defaultDivisionId for admin/recorder
watch(
  () => formData.value.role,
  (newRole) => {
    if (newRole === "admin" || newRole === "recorder") {
      formData.value.defaultDivisionId = "";
    }
  }
);

onMounted(() => {
  loadArchers();
  loadDivisions();
});

async function loadArchers() {
  loading.value = true;
  error.value = "";

  try {
    const params = {};
    if (searchTerm.value) params.search = searchTerm.value;
    if (filterRole.value) params.role = filterRole.value;

    const response = await api.get("/archers", { params });
    archers.value = response.data.archers;
  } catch (err) {
    error.value = err.response?.data?.error || "Failed to load archers";
  } finally {
    loading.value = false;
  }
}

async function loadDivisions() {
  try {
    const response = await api.get("/divisions");
    divisions.value = response.data.divisions;
  } catch (err) {
    console.error("Failed to load divisions:", err);
  }
}

function openAddModal() {
  isEditMode.value = false;
  formData.value = {
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    role: "archer",
    defaultDivisionId: "",
    password: "",
  };
  formError.value = "";
  showFormModal.value = true;
}

function viewArcher(archer) {
  selectedArcher.value = archer;
  showViewModal.value = true;
}

function editArcher(archer) {
  isEditMode.value = true;
  selectedArcher.value = archer;
  formData.value = {
    firstName: archer.FirstName,
    lastName: archer.LastName,
    email: archer.Email,
    dateOfBirth: archer.DateOfBirth,
    gender: archer.Gender,
    role: archer.Role,
    defaultDivisionId: archer.DefaultDivisionID || "",
    password: "",
  };
  formError.value = "";
  showViewModal.value = false;
  showFormModal.value = true;
}

async function saveArcher() {
  formLoading.value = true;
  formError.value = "";

  try {
    const payload = {
      FirstName: formData.value.firstName,
      LastName: formData.value.lastName,
      Email: formData.value.email,
      DateOfBirth: formData.value.dateOfBirth,
      Gender: formData.value.gender,
      Role: formData.value.role,
      DivisionID: formData.value.defaultDivisionId || null,
    };

    if (formData.value.password) {
      payload.Password = formData.value.password;
    }

    if (isEditMode.value) {
      await api.put(`/archers/${selectedArcher.value.ArcherID}`, payload);
    } else {
      await api.post("/archers", payload);
    }

    await loadArchers();
    closeFormModal();
  } catch (err) {
    formError.value =
      err.response?.data?.error ||
      `Failed to ${isEditMode.value ? "update" : "create"} archer`;
  } finally {
    formLoading.value = false;
  }
}

async function deleteArcher(archer) {
  if (
    !confirm(
      `Are you sure you want to delete ${archer.FirstName} ${archer.LastName}?\n\nThis will also delete all their scores and cannot be undone.`
    )
  ) {
    return;
  }

  try {
    await api.delete(`/archers/${archer.ArcherID}`);
    await loadArchers();
  } catch (err) {
    alert(err.response?.data?.error || "Failed to delete archer");
  }
}

function closeViewModal() {
  showViewModal.value = false;
  selectedArcher.value = null;
}

function closeFormModal() {
  showFormModal.value = false;
  selectedArcher.value = null;
  formError.value = "";
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.btn-small {
  padding: 6px 12px;
  font-size: 14px;
  margin-right: 8px;
}

.btn-info {
  background: var(--info-color, #17a2b8);
}

.btn-info:hover {
  background: #138496;
}

.btn-warning {
  background: var(--warning-color, #ffc107);
  color: #000;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-danger {
  background: var(--danger-color, #dc3545);
}

.btn-danger:hover {
  background: #c82333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #ffffff;
  font-size: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid #444;
  border-radius: 6px;
  color: #000000;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-group input:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
}

.form-group small {
  display: block;
  margin-top: 4px;
  color: #aaaaaa;
  font-size: 12px;
}

@media (max-width: 768px) {
  .detail-grid,
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
