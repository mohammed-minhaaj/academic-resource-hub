if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const ExpressError = require("./utils/expressError");

const app = express();

// Trust reverse proxy in production (e.g. Render, Railway, Heroku, Nginx)
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// -----------------------------------------------------------------------------
// Database Connection
// -----------------------------------------------------------------------------
const dbUrl = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/academic_resource_db";

mongoose
    .connect(dbUrl)
    .then(() => {
        console.log("MongoDB connection established successfully.");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });

// -----------------------------------------------------------------------------
// View Engine Setup (EJS + ejs-mate)
// -----------------------------------------------------------------------------
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// -----------------------------------------------------------------------------
// Core Request Parsers & Static Files
// -----------------------------------------------------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(cookieParser(process.env.COOKIE_SECRET || "academic_resource_cookie_secret"));
app.use(express.static(path.join(__dirname, "public")));

// -----------------------------------------------------------------------------
// Session & Flash Configuration
// Note: Sessions are strictly used for transient flash messages.
// Authentication state is managed via JWT in an HTTP-only cookie.
// -----------------------------------------------------------------------------
const sessionConfig = {
    name: "ar_session",
    secret: process.env.SESSION_SECRET || "academic_resource_session_secret_default",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
};

app.use(session(sessionConfig));
app.use(flash());

// -----------------------------------------------------------------------------
// Global Template Middleware (res.locals)
// Provides success/error flash messages and currUser to all EJS templates
// -----------------------------------------------------------------------------
app.use((req, res, next) => {
    // Extract JWT from HTTP-only cookie to populate req.user if not already set
    if (!req.user && req.cookies && req.cookies.token) {
        try {
            const decoded = jwt.verify(
                req.cookies.token,
                process.env.JWT_SECRET || "academic_jwt_secret_default"
            );
            req.user = decoded;
        } catch (err) {
            // Token expired or invalid; clear user context
            req.user = null;
        }
    }

    res.locals.currUser = req.user || null;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// -----------------------------------------------------------------------------
// Routes (Mount routes here as features are developed)
// -----------------------------------------------------------------------------
app.get("/", (req, res) => {
    res.render("home");
});

const userRoutes = require("./routes/user");
const resourceRoutes = require("./routes/resource");
const adminRoutes = require("./routes/admin");

app.use("/", userRoutes);
app.use("/resources", resourceRoutes);
app.use("/admin", adminRoutes);

// -----------------------------------------------------------------------------
// 404 Catch-All Handler
// -----------------------------------------------------------------------------
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

// -----------------------------------------------------------------------------
// Centralized Error Handling Middleware
// -----------------------------------------------------------------------------
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Something went wrong!";

    if (res.headersSent) {
        return next(err);
    }

    res.status(statusCode);

    if (req.accepts("html")) {
        res.render("error", { err });
    } else {
        res.json({
            status: "error",
            statusCode,
            message: err.message,
            ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
        });
    }
});

// -----------------------------------------------------------------------------
// Server Initialization
// -----------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Academic Resource Sharing server running on port ${PORT}`);
});

module.exports = app;
