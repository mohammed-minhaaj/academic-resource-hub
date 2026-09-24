const express = require("express");
const router = express.Router();
const resourceController = require("../controllers/resource");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isOwner, validateResource } = require("../middleware");
const { upload } = require("../utils/s3Config");

// Discovery route & Resource creation
router
    .route("/")
    .get(wrapAsync(resourceController.index))
    .post(
        isLoggedIn,
        upload.single("file"),
        validateResource,
        wrapAsync(resourceController.createResource)
    );

// Render new resource form
router.get("/new", isLoggedIn, resourceController.renderNewForm);

// User's own uploaded resources management page
router.get(
    "/my-resources",
    isLoggedIn,
    wrapAsync(resourceController.myResources)
);

// Show, Update, and Delete resource
router
    .route("/:id")
    .get(wrapAsync(resourceController.showResource))
    .put(
        isLoggedIn,
        isOwner,
        upload.single("file"),
        validateResource,
        wrapAsync(resourceController.updateResource)
    )
    .delete(
        isLoggedIn,
        isOwner,
        wrapAsync(resourceController.deleteResource)
    );

// Render edit resource form
router.get(
    "/:id/edit",
    isLoggedIn,
    isOwner,
    wrapAsync(resourceController.renderEditForm)
);

// Reporting route: Accessible by regular users to increment reportCount
router.post(
    "/:id/report",
    isLoggedIn,
    wrapAsync(resourceController.reportResource)
);

module.exports = router;
