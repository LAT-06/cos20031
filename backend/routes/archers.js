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

// Admin only routes
router.post("/", auth, roleCheck("admin"), archerController.createArcher);
router.delete("/:id", auth, roleCheck("admin"), archerController.deleteArcher);

// Self or admin/recorder can update
router.put("/:id", auth, archerController.updateArcher);

module.exports = router;
