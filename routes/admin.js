const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isAdmin } = require("../middleware");

// Protect all admin routes below with authentication and ADMIN role check
router.use(isLoggedIn, isAdmin);

// Admin Dashboard: Fetch all resources across all branches and statuses
router.get("/dashboard", wrapAsync(adminController.dashboard));
router.get("/", wrapAsync(adminController.dashboard));

// Moderate Resource status (APPROVED / REJECTED)
router.patch("/resources/:id/status", wrapAsync(adminController.moderateResource));
router.patch("/resources/:id", wrapAsync(adminController.moderateResource));

// Admin Delete: Remove inappropriate resources
router.delete("/resources/:id", wrapAsync(adminController.deleteResource));

module.exports = router;
