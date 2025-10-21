import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/auth/Login.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/signup",
    name: "Signup",
    component: () => import("@/views/auth/Signup.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/admin",
    component: () => import("@/views/admin/AdminLayout.vue"),
    meta: { requiresAuth: true, roles: ["admin", "recorder"] },
    children: [
      {
        path: "",
        name: "AdminDashboard",
        component: () => import("@/views/admin/Dashboard.vue"),
      },
      {
        path: "archers",
        name: "AdminArchers",
        component: () => import("@/views/admin/Archers.vue"),
      },
      {
        path: "rounds",
        name: "AdminRounds",
        component: () => import("@/views/admin/Rounds.vue"),
      },
      {
        path: "competitions",
        name: "AdminCompetitions",
        component: () => import("@/views/admin/Competitions.vue"),
      },
      {
        path: "scores",
        name: "AdminScores",
        component: () => import("@/views/admin/Scores.vue"),
      },
      {
        path: "championships",
        name: "AdminChampionships",
        component: () => import("@/views/admin/Championships.vue"),
      },
    ],
  },
  {
    path: "/archer",
    component: () => import("@/views/archer/ArcherLayout.vue"),
    meta: { requiresAuth: true, roles: ["archer", "admin", "recorder"] },
    children: [
      {
        path: "",
        name: "ArcherDashboard",
        component: () => import("@/views/archer/Dashboard.vue"),
      },
      {
        path: "score-entry",
        name: "ScoreEntry",
        component: () => import("@/views/archer/ScoreEntry.vue"),
      },
      {
        path: "scores",
        name: "ArcherScores",
        component: () => import("@/views/archer/Scores.vue"),
      },
      {
        path: "competitions",
        name: "ArcherCompetitions",
        component: () => import("@/views/archer/Competitions.vue"),
      },
      {
        path: "rounds",
        name: "ArcherRounds",
        component: () => import("@/views/archer/Rounds.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // Initialize auth from localStorage if not already done
  if (!authStore.token) {
    authStore.initializeAuth();
  }

  console.log("Router Guard:", {
    to: to.path,
    from: from.path,
    requiresAuth: to.meta.requiresAuth,
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    token: authStore.token ? "exists" : "null",
  });

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log("Redirecting to login: Not authenticated");
    next("/login");
    return;
  }

  // If authenticated and trying to access login/signup, redirect to appropriate dashboard
  // TEMPORARILY DISABLED FOR TESTING
  /*
  if (!to.meta.requiresAuth && authStore.isAuthenticated) {
    console.log('Already authenticated, redirecting to dashboard')
    if (authStore.isAdmin || authStore.isRecorder) {
      next('/admin')
    } else {
      next('/archer')
    }
    return
  }
  */

  // Check role-based access
  if (to.meta.roles && authStore.isAuthenticated) {
    const userRole = authStore.user?.role;
    if (!to.meta.roles.includes(userRole)) {
      console.log("Role not allowed, redirecting");
      // Redirect to appropriate dashboard
      if (userRole === "archer") {
        next("/archer");
      } else {
        next("/admin");
      }
      return;
    }
  }

  console.log("Navigation allowed");
  next();
});

export default router;
