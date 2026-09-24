const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

/**
 * Branch mapping dictionary for VNR VJIET roll number / email format.
 * Maps 2-digit branch code (indices 6 and 7) to Department/Branch Acronym.
 */
const BRANCH_CODE_MAP = {
    "72": "AID",
    "24": "AUT",
    "01": "CIV",
    "32": "CSBS",
    "62": "CSC",
    "67": "CSD",
    "05": "CSE",
    "66": "CSM",
    "69": "CSO",
    "04": "ECE",
    "02": "EEE",
    "10": "EIE",
    "77": "EVL",
    "12": "INF",
    "03": "MECH",
    "39": "RAI",
};

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "College email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            validate: {
                validator: function (v) {
                    return /^.+@vnrvjiet\.in$/i.test(v);
                },
                message: (props) =>
                    `${props.value} is not a valid college email. Only @vnrvjiet.in domains are permitted.`,
            },
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        role: {
            type: String,
            enum: ["USER", "ADMIN"],
            default: "USER",
        },
        branch: {
            type: String,
            trim: true,
            uppercase: true,
        },
    },
    {
        timestamps: true,
    }
);

/**
 * Mongoose Pre-save Hook:
 * 1. Automatically extracts the branch from VNR VJIET email address.
 *    E.g. "25071a6643@vnrvjiet.in" -> index 6 & 7 = "66" -> "CSM".
 * 2. Hashes password using bcrypt if newly created or modified and not already hashed.
 */
userSchema.pre("save", async function (next) {
    // 1. Branch Extraction Logic
    if (this.role === "ADMIN") {
        this.branch = "ADMIN";
    } else if (this.isModified("email") && this.email) {
        const cleanEmail = this.email.trim().toLowerCase();
        // Ensure email has enough characters to extract index 6 and 7
        if (cleanEmail.length >= 8) {
            const branchCode = cleanEmail.substring(6, 8); // Indices 6 and 7
            if (BRANCH_CODE_MAP[branchCode]) {
                this.branch = BRANCH_CODE_MAP[branchCode];
            }
        }
    }

    // 2. Defensive Password Hashing
    // If password was modified and is not already a bcrypt hash
    if (this.isModified("password") && this.password) {
        const isAlreadyHashed = /^\$2[aby]\$\d{2}\$/.test(this.password);
        if (!isAlreadyHashed) {
            const saltRounds = 12;
            this.password = await bcrypt.hash(this.password, saltRounds);
        }
    }

    next();
});

/**
 * Instance method to verify password during login
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
module.exports.BRANCH_CODE_MAP = BRANCH_CODE_MAP;
