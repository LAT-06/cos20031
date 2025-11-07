<template>
  <main>
    <h1>Equivalent Rounds</h1>
    <p style="color: var(--muted-text); margin-bottom: 20px">Manage mapping rules between rounds for specific categories (Class + Division) with active date ranges.</p>

    <div class="layout">
      <section class="list-panel">
        <div class="panel-header">
          <h2>Existing Rules</h2>
          <button @click="openCreate" class="btn btn-primary btn-small">+ New Rule</button>
        </div>

        <div class="filters">
          <select v-model="filters.categoryId" @change="loadRules">
            <option value="">All Categories</option>
            <option v-for="c in categories" :key="c.CategoryID" :value="c.CategoryID">
              {{ c.Name }}
            </option>
          </select>
          <select v-model="filters.baseRoundId" @change="loadRules">
            <option value="">All Base Rounds</option>
            <option v-for="r in rounds" :key="r.RoundID" :value="r.RoundID">{{ r.Name }}</option>
          </select>
        </div>

        <div v-if="loading" class="loading">Loading rules...</div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <table v-else class="rules-table">
          <thead>
            <tr>
              <th>Base Round</th>
              <th>Equivalent Round</th>
              <th>Category</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rule in rules" :key="rule.EquivalentID">
              <td>{{ rule.baseRound?.Name }}</td>
              <td>{{ rule.equivalentRound?.Name }}</td>
              <td>{{ rule.category?.Name }}</td>
              <td>{{ rule.StartDate }}</td>
              <td>{{ rule.EndDate || '—' }}</td>
              <td>
                <button class="btn-small" @click="editRule(rule)">Edit</button>
                <button class="btn-small btn-danger" @click="deleteRule(rule)">Delete</button>
              </td>
            </tr>
            <tr v-if="rules.length === 0">
              <td colspan="6" style="text-align:center; padding:30px">No rules found</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="showForm" class="form-panel">
        <h2>{{ formMode === 'create' ? 'Create' : 'Edit' }} Equivalent Rule</h2>
        <form @submit.prevent="saveRule" class="rule-form">
          <div class="form-group">
            <label>Base Round *</label>
            <select v-model.number="form.baseRoundId" required>
              <option value="" disabled>Select base round</option>
              <option v-for="r in rounds" :key="r.RoundID" :value="r.RoundID">{{ r.Name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Equivalent Round *</label>
            <select v-model.number="form.equivalentRoundId" required>
              <option value="" disabled>Select equivalent round</option>
              <option v-for="r in rounds" :key="r.RoundID" :value="r.RoundID">{{ r.Name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Category *</label>
            <select v-model.number="form.categoryId" required>
              <option value="" disabled>Select category</option>
              <option v-for="c in categories" :key="c.CategoryID" :value="c.CategoryID">{{ c.Name }}</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Start Date *</label>
              <input type="date" v-model="form.startDate" required />
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input type="date" v-model="form.endDate" />
            </div>
          </div>

          <div v-if="formError" class="error-message">{{ formError }}</div>

            <ul v-if="validationWarnings.length" class="warning-list">
              <li v-for="w in validationWarnings" :key="w">⚠️ {{ w }}</li>
            </ul>

          <div class="actions">
            <button type="button" class="btn btn-secondary" @click="closeForm">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Saving...' : (formMode === 'create' ? 'Create' : 'Update') }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import api from '@/services/api';

const rules = ref([]);
const rounds = ref([]);
const categories = ref([]);
const loading = ref(false);
const error = ref('');

const filters = ref({ categoryId: '', baseRoundId: '' });

const showForm = ref(false);
const formMode = ref('create');
const saving = ref(false);
const formError = ref('');
const validationWarnings = ref([]);

const form = ref({
  baseRoundId: '',
  equivalentRoundId: '',
  categoryId: '',
  startDate: '',
  endDate: ''
});

onMounted(async () => {
  await Promise.all([loadRounds(), loadCategories()]);
  await loadRules();
});

async function loadRounds() {
  try {
    const res = await api.get('/rounds');
    rounds.value = res.data.rounds || [];
  } catch (e) {
    console.error(e);
  }
}

async function loadCategories() {
  try {
    const res = await api.get('/categories');
    categories.value = res.data.categories || [];
  } catch (e) {
    console.error(e);
  }
}

async function loadRules() {
  loading.value = true;
  error.value = '';
  try {
    const params = {};
    if (filters.value.categoryId) params.categoryId = filters.value.categoryId;
    if (filters.value.baseRoundId) params.baseRoundId = filters.value.baseRoundId;
    const res = await api.get('/rounds/equivalent', { params });
    rules.value = res.data.equivalents || [];
  } catch (e) {
    error.value = e.message || 'Failed to load rules';
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  formMode.value = 'create';
  form.value = { baseRoundId: '', equivalentRoundId: '', categoryId: '', startDate: today(), endDate: '' };
  formError.value = '';
  validationWarnings.value = [];
  showForm.value = true;
}

function editRule(rule) {
  formMode.value = 'edit';
  form.value = {
    baseRoundId: rule.BaseRoundID,
    equivalentRoundId: rule.EquivalentRoundID,
    categoryId: rule.CategoryID,
    startDate: rule.StartDate,
    endDate: rule.EndDate || ''
  };
  formError.value = '';
  validationWarnings.value = [];
  showForm.value = true;
  form.value._id = rule.EquivalentID;
}

function closeForm() {
  showForm.value = false;
}

function today() {
  return new Date().toISOString().slice(0,10);
}

function validateOverlap() {
  validationWarnings.value = [];
  const overlapping = rules.value.filter(r =>
    r.CategoryID === form.value.categoryId &&
    r.BaseRoundID === form.value.baseRoundId &&
    r.EquivalentRoundID === form.value.equivalentRoundId &&
    r.EquivalentID !== form.value._id &&
    dateRangesOverlap(form.value.startDate, form.value.endDate || null, r.StartDate, r.EndDate || null)
  );
  if (overlapping.length) {
    validationWarnings.value.push(`There are ${overlapping.length} overlapping rule(s). Adjust dates.`);
  }
  if (form.value.baseRoundId && form.value.equivalentRoundId && form.value.baseRoundId === form.value.equivalentRoundId) {
    validationWarnings.value.push('Base and Equivalent rounds cannot be the same.');
  }
}

watch(form, validateOverlap, { deep: true });

function dateRangesOverlap(startA, endA, startB, endB) {
  const sA = new Date(startA);
  const eA = endA ? new Date(endA) : null;
  const sB = new Date(startB);
  const eB = endB ? new Date(endB) : null;
  if (eA && eB) return sA <= eB && sB <= eA;
  if (eA && !eB) return sB <= eA;
  if (!eA && eB) return sA <= eB;
  return true; // both open-ended
}

async function saveRule() {
  formError.value = '';
  validateOverlap();
  if (validationWarnings.value.some(w => w.includes('overlapping'))) {
    formError.value = 'Cannot save while overlaps exist.';
    return;
  }
  saving.value = true;
  try {
    const payload = {
      baseRoundId: form.value.baseRoundId,
      equivalentRoundId: form.value.equivalentRoundId,
      categoryId: form.value.categoryId,
      startDate: form.value.startDate,
      endDate: form.value.endDate || null
    };
    if (formMode.value === 'edit') {
      await api.put(`/rounds/equivalent/${form.value._id}`, payload);
    } else {
      await api.post('/rounds/equivalent', payload);
    }
    await loadRules();
    closeForm();
  } catch (e) {
    formError.value = e.message || 'Failed to save rule';
  } finally {
    saving.value = false;
  }
}

async function deleteRule(rule) {
  if (!confirm(`Delete mapping ${rule.baseRound?.Name} → ${rule.equivalentRound?.Name}?`)) return;
  try {
    await api.delete(`/rounds/equivalent/${rule.EquivalentID}`);
    await loadRules();
  } catch (e) {
    alert(e.message || 'Failed to delete');
  }
}
</script>

<style scoped>
.layout { display: flex; flex-wrap: wrap; gap: 32px; }
.list-panel { flex: 2 1 600px; background: var(--panel); padding:24px; border-radius: var(--radius); box-shadow: var(--shadow); }
.form-panel { flex: 1 1 340px; background: var(--panel); padding:24px; border-radius: var(--radius); box-shadow: var(--shadow); }
.panel-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.filters { display:flex; gap:12px; margin-bottom:16px; }
.filters select { flex:1; }
.rules-table { width:100%; border-collapse: collapse; }
.rules-table th, .rules-table td { padding:8px 10px; border-bottom:1px solid var(--muted); text-align:left; }
.rules-table th { background: var(--muted); font-weight:600; }
.rule-form { display:flex; flex-direction:column; gap:16px; }
.form-group { display:flex; flex-direction:column; gap:4px; }
.form-group label { font-size:0.85rem; font-weight:600; color: var(--muted-text); }
.form-group select, .form-group input { padding:8px; border:1px solid var(--muted); border-radius:6px; background: white; }
.form-row { display:flex; gap:16px; }
.form-row .form-group { flex:1; }
.actions { display:flex; justify-content:flex-end; gap:12px; }
.btn-small { padding:4px 10px; font-size:12px; }
.btn-danger { background:#dc3545; color:#fff; }
.error-message { background:#fee; color:#c33; padding:10px 12px; border-radius:6px; font-size:0.85rem; }
.warning-list { background:#fff8e1; color:#8a6d00; padding:10px 12px; border-radius:6px; list-style:none; font-size:0.75rem; display:flex; flex-direction:column; gap:4px; }
.loading { text-align:center; padding:40px; color: var(--muted-text); }
@media (max-width:900px){ .layout { flex-direction:column; } .form-row { flex-direction:column; } }
</style>
