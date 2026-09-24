require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user");
const Resource = require("./models/resource");

const dbUrl = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/academic_resource_db";

const sampleResources = [
    {
        title: "Operating Systems - Complete Unit 1 to 5 Notes",
        description: "Comprehensive handwritten and digital lecture notes covering Process Scheduling, Concurrency, Deadlocks, Memory Management, and File Systems.",
        subject: "Operating Systems",
        resourceType: "NOTES",
        branch: "CSM",
        status: "APPROVED",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        semester: 4,
    },
    {
        title: "Machine Learning End Semester Exam PYQ (2024)",
        description: "Official VNR VJIET R19/R22 End Semester Question Paper with solutions for Machine Learning and Neural Networks.",
        subject: "Machine Learning",
        resourceType: "PYQ",
        branch: "CSM",
        status: "APPROVED",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        semester: 5,
    },
    {
        title: "DBMS Lab Manual and Experiment Source Queries",
        description: "SQL queries, PL/SQL trigger procedures, ER diagrams, and normalization sample case studies.",
        subject: "Database Management Systems",
        resourceType: "LAB_MANUAL",
        branch: "CSM",
        status: "PENDING",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        semester: 4,
    },
    {
        title: "Signals and Systems Mid-1 Formula Sheet",
        description: "Quick revision formula sheet for Continuous-time Fourier Transform and Laplace Transform.",
        subject: "Signals and Systems",
        resourceType: "NOTES",
        branch: "ECE",
        status: "APPROVED",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        semester: 3,
    },
];

async function seedDatabase() {
    try {
        console.log(`Connecting to MongoDB at: ${dbUrl}...`);
        await mongoose.connect(dbUrl);
        console.log("Connected successfully!");

        // Clear existing records
        await User.deleteMany({});
        await Resource.deleteMany({});
        console.log("Cleared existing users and resources.");

        // 1. Create Admin User
        const adminUser = new User({
            email: "admin@vnrvjiet.in",
            password: "adminpassword123",
            role: "ADMIN",
            branch: "ADMIN",
        });
        await adminUser.save();
        console.log("Created Admin: admin@vnrvjiet.in (password: adminpassword123)");

        // 2. Create Student User 1 (CSM branch from 66 in email)
        const studentUser1 = new User({
            email: "25071a6643@vnrvjiet.in",
            password: "studentpassword123",
            role: "USER",
        });
        await studentUser1.save();
        console.log(`Created Student: 25071a6643@vnrvjiet.in (branch: ${studentUser1.branch}, password: studentpassword123)`);

        // 3. Create Student User 2 (ECE branch from 04 in email)
        const studentUser2 = new User({
            email: "25071a0412@vnrvjiet.in",
            password: "studentpassword123",
            role: "USER",
        });
        await studentUser2.save();
        console.log(`Created Student: 25071a0412@vnrvjiet.in (branch: ${studentUser2.branch}, password: studentpassword123)`);

        // 4. Create Resources
        for (let i = 0; i < sampleResources.length; i++) {
            const data = sampleResources[i];
            const uploader = data.branch === "ECE" ? studentUser2 : studentUser1;
            const resource = new Resource({
                ...data,
                uploader: uploader._id,
            });
            await resource.save();
        }
        console.log(`Seeded ${sampleResources.length} sample resources across branches.`);

        console.log("\nDatabase seeding completed successfully!");
    } catch (err) {
        console.error("Seeding error:", err);
    } finally {
        await mongoose.connection.close();
        console.log("Database connection closed.");
    }
}

seedDatabase();
