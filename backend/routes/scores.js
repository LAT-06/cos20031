const express = require("express");
const router = express.Router();
const scoreController = require("../controllers/scoreController");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// All authenticated users can view scores
router.get("/", auth, scoreController.getAllScores);
router.get("/club-records", auth, scoreController.getClubRecords);
router.get("/:id", auth, scoreController.getScoreById);

// Staged scores (recorder/admin only)
router.get(
  "/staged/list",
  auth,
  roleCheck(["admin", "recorder"]),
  scoreController.getStagedScores
);

// Archers can create and update their own scores
router.post("/", auth, scoreController.createScore);
router.put("/:id", auth, scoreController.updateScore);

// Recorder/Admin actions
router.post(
  "/:id/approve",
  auth,
  roleCheck(["admin", "recorder"]),
  scoreController.approveScore
);
router.post(
  "/:id/reject",
  auth,
  roleCheck(["admin", "recorder"]),
  scoreController.rejectScore
);
router.put(
  "/:id/status",
  auth,
  roleCheck(["admin", "recorder"]),
  scoreController.updateScoreStatus
);

// Admin only
router.delete("/:id", auth, roleCheck("admin"), scoreController.deleteScore);

module.exports = router;
