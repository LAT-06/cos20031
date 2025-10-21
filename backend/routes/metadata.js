const express = require("express");
const router = express.Router();
const { Class, Division, Category } = require("../models");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// Get all classes (public - needed for signup/public views)
router.get("/classes", async (req, res) => {
  try {
    const classes = await Class.findAll({
      order: [["Name", "ASC"]],
    });
    res.json({ classes });
  } catch (error) {
    console.error("Get classes error:", error);
    res.status(500).json({ error: "Failed to fetch classes" });
  }
});

// Get all divisions (public - needed for signup)
router.get("/divisions", async (req, res) => {
  try {
    const divisions = await Division.findAll({
      order: [["Name", "ASC"]],
    });
    res.json({ divisions });
  } catch (error) {
    console.error("Get divisions error:", error);
    res.status(500).json({ error: "Failed to fetch divisions" });
  }
});

// Get all categories
router.get("/categories", auth, async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        { model: Class, as: "class" },
        { model: Division, as: "division" },
      ],
      order: [["Name", "ASC"]],
    });
    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Create category (admin only)
router.post("/categories", auth, roleCheck("admin"), async (req, res) => {
  try {
    const { classId, divisionId, name } = req.body;

    const category = await Category.create({
      ClassID: classId,
      DivisionID: divisionId,
      Name: name,
    });

    const result = await Category.findByPk(category.CategoryID, {
      include: [
        { model: Class, as: "class" },
        { model: Division, as: "division" },
      ],
    });

    res.status(201).json({
      message: "Category created successfully",
      category: result,
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

module.exports = router;
