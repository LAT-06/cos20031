const {
  sequelize,
  Archer,
  Class,
  Division,
  Category,
  Round,
  RoundRange,
} = require("../models");
require("dotenv").config();

async function seed() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Connection successful!");

    console.log("Creating tables...");
    await sequelize.sync({ force: true }); // WARNING: This will drop existing tables
    console.log("Tables created!");

    // Seed Classes
    console.log("Seeding classes...");
    const classes = await Class.bulkCreate([
      { Name: "Male Open", AgeMin: 18, AgeMax: 49, Gender: "Male" },
      { Name: "Female Open", AgeMin: 18, AgeMax: 49, Gender: "Female" },
      { Name: "50+ Male", AgeMin: 50, AgeMax: 59, Gender: "Male" },
      { Name: "50+ Female", AgeMin: 50, AgeMax: 59, Gender: "Female" },
      { Name: "60+ Male", AgeMin: 60, AgeMax: 69, Gender: "Male" },
      { Name: "60+ Female", AgeMin: 60, AgeMax: 69, Gender: "Female" },
      { Name: "70+ Male", AgeMin: 70, AgeMax: null, Gender: "Male" },
      { Name: "70+ Female", AgeMin: 70, AgeMax: null, Gender: "Female" },
      { Name: "Under 21 Male", AgeMin: 18, AgeMax: 20, Gender: "Male" },
      { Name: "Under 21 Female", AgeMin: 18, AgeMax: 20, Gender: "Female" },
      { Name: "Under 18 Male", AgeMin: 16, AgeMax: 17, Gender: "Male" },
      { Name: "Under 18 Female", AgeMin: 16, AgeMax: 17, Gender: "Female" },
      { Name: "Under 16 Male", AgeMin: 14, AgeMax: 15, Gender: "Male" },
      { Name: "Under 16 Female", AgeMin: 14, AgeMax: 15, Gender: "Female" },
      { Name: "Under 14 Male", AgeMin: null, AgeMax: 13, Gender: "Male" },
      { Name: "Under 14 Female", AgeMin: null, AgeMax: 13, Gender: "Female" },
    ]);
    console.log(`${classes.length} classes created!`);

    // Seed Divisions
    console.log("Seeding divisions...");
    const divisions = await Division.bulkCreate([
      { Name: "Recurve", Description: "Traditional recurve bow" },
      {
        Name: "Compound",
        Description: "Compound bow with sights and stabilizers",
      },
      { Name: "Recurve Barebow", Description: "Recurve without sights" },
      { Name: "Compound Barebow", Description: "Compound without sights" },
      { Name: "Longbow", Description: "Traditional longbow" },
    ]);
    console.log(`${divisions.length} divisions created!`);

    // Seed Categories (combination of classes and divisions)
    console.log("Seeding categories...");
    const categories = [];
    for (const cls of classes) {
      for (const div of divisions) {
        categories.push({
          ClassID: cls.ClassID,
          DivisionID: div.DivisionID,
          Name: `${cls.Name} - ${div.Name}`,
        });
      }
    }
    await Category.bulkCreate(categories);
    console.log(`${categories.length} categories created!`);

    // Seed Sample Rounds
    console.log("Seeding sample rounds...");

    // WA 1440 (formerly FITA)
    const wa1440 = await Round.create({
      Name: "WA 1440",
      Description:
        "World Archery 1440 Round (formerly FITA Round) - 144 arrows",
    });
    await RoundRange.bulkCreate([
      {
        RoundID: wa1440.RoundID,
        RangeNo: 1,
        Distance: 90,
        Ends: 6,
        TargetFace: "122cm",
      },
      {
        RoundID: wa1440.RoundID,
        RangeNo: 2,
        Distance: 70,
        Ends: 6,
        TargetFace: "122cm",
      },
      {
        RoundID: wa1440.RoundID,
        RangeNo: 3,
        Distance: 50,
        Ends: 6,
        TargetFace: "80cm",
      },
      {
        RoundID: wa1440.RoundID,
        RangeNo: 4,
        Distance: 30,
        Ends: 6,
        TargetFace: "80cm",
      },
    ]);

    // WA 70m Round
    const wa70 = await Round.create({
      Name: "WA 70m",
      Description:
        "World Archery 70m Round - 72 arrows, used in Olympic competition",
    });
    await RoundRange.bulkCreate([
      {
        RoundID: wa70.RoundID,
        RangeNo: 1,
        Distance: 70,
        Ends: 6,
        TargetFace: "122cm",
      },
      {
        RoundID: wa70.RoundID,
        RangeNo: 2,
        Distance: 70,
        Ends: 6,
        TargetFace: "122cm",
      },
    ]);

    // WA 50m Round
    const wa50 = await Round.create({
      Name: "WA 50m",
      Description: "World Archery 50m Round - 72 arrows",
    });
    await RoundRange.bulkCreate([
      {
        RoundID: wa50.RoundID,
        RangeNo: 1,
        Distance: 50,
        Ends: 6,
        TargetFace: "80cm",
      },
      {
        RoundID: wa50.RoundID,
        RangeNo: 2,
        Distance: 50,
        Ends: 6,
        TargetFace: "80cm",
      },
    ]);

    // Indoor 18m
    const indoor18 = await Round.create({
      Name: "Indoor 18m",
      Description: "Indoor 18m Round - 60 arrows",
    });
    await RoundRange.bulkCreate([
      {
        RoundID: indoor18.RoundID,
        RangeNo: 1,
        Distance: 18,
        Ends: 5,
        TargetFace: "40cm",
      },
      {
        RoundID: indoor18.RoundID,
        RangeNo: 2,
        Distance: 18,
        Ends: 5,
        TargetFace: "40cm",
      },
    ]);

    // Indoor 25m
    const indoor25 = await Round.create({
      Name: "Indoor 25m",
      Description: "Indoor 25m Round - 60 arrows",
    });
    await RoundRange.bulkCreate([
      {
        RoundID: indoor25.RoundID,
        RangeNo: 1,
        Distance: 25,
        Ends: 5,
        TargetFace: "60cm",
      },
      {
        RoundID: indoor25.RoundID,
        RangeNo: 2,
        Distance: 25,
        Ends: 5,
        TargetFace: "60cm",
      },
    ]);

    console.log("Sample rounds created!");

    // Create default admin user
    console.log("Creating default admin user...");
    const recurve = divisions.find((d) => d.Name === "Recurve");
    const maleOpen = classes.find((c) => c.Name === "Male Open");

    await Archer.create({
      FirstName: "Admin",
      LastName: "User",
      DateOfBirth: "1990-01-01",
      Gender: "Male",
      Email: "admin@archery.club",
      PasswordHash: "admin123", // Will be hashed by model hook
      Role: "admin",
      DefaultDivisionID: recurve.DivisionID,
      ClassID: maleOpen.ClassID,
    });
    console.log("Default admin created!");
    console.log("Email: admin@archery.club");
    console.log("Password: admin123");

    console.log("\n✅ Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
