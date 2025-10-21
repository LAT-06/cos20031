const express = require("express");
const router = express.Router();
const archerController = require("../controllers/archerController");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// Public/authenticated routes
router.get(
  "/",
  auth,
  roleCheck(["admin", "recorder"]),
  archerController.getAllArchers
);
router.get("/:id", auth, archerController.getArcherById);
router.get("/:id/scores", auth, archerController.getArcherScores);
router.get("/:id/personal-bests", auth, archerController.getPersonalBests);
router.get("/:id/pending-changes", auth, archerController.getPendingChanges);

// Update requests management (admin/recorder only)
router.get(
  "/requests/pending",
  auth,
  roleCheck(["admin", "recorder"]),
  archerController.getAllUpdateRequests
);
router.post(
  "/requests/:requestId/approve",
  auth,
  roleCheck(["admin", "recorder"]),
  archerController.approveUpdateRequest
);
router.post(
  "/requests/:requestId/reject",
  auth,
  roleCheck(["admin", "recorder"]),
  archerController.rejectUpdateRequest
);

// Admin only routes
router.post("/", auth, roleCheck("admin"), archerController.createArcher);
router.delete("/:id", auth, roleCheck("admin"), archerController.deleteArcher);

// Self or admin/recorder can update
router.put("/:id", auth, archerController.updateArcher);

module.exports = router;
