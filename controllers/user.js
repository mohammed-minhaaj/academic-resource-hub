const jwt = require("jsonwebtoken");
const User = require("../models/user");

/**
 * Render the user registration form
 */
module.exports.renderRegister = (req, res) => {
    res.render("users/register");
};

/**
 * Process user registration (Signup)
 */
module.exports.register = async (req, res, next) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            req.flash("error", "Email and password are required.");
            return res.redirect("/register");
        }

        const cleanEmail = email.toLowerCase().trim();
        if (!cleanEmail.endsWith("@vnrvjiet.in")) {
            req.flash(
                "error",
                "Registration is strictly restricted to official college emails (@vnrvjiet.in)."
            );
            return res.redirect("/register");
        }

        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
            req.flash("error", "An account with this email address already exists.");
            return res.redirect("/register");
        }

        // Branch is automatically extracted and password is hashed via pre-save hook
        const user = new User({
            email: email.toLowerCase().trim(),
            password,
            ...(role && ["USER", "ADMIN"].includes(role.toUpperCase()) && {
                role: role.toUpperCase(),
            }),
        });

        await user.save();

        // Generate JWT Token
        const token = jwt.sign(
            {
                _id: user._id,
                email: user.email,
                role: user.role,
                branch: user.branch,
            },
            process.env.JWT_SECRET || "academic_jwt_secret_default",
            { expiresIn: "7d" }
        );

        // Store JWT in HTTP-only Cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: "lax",
        });

        req.flash("success", "Welcome back!");
        const redirectUrl = req.session.returnTo || "/";
        delete req.session.returnTo;
        res.redirect(redirectUrl);
    } catch (err) {
        next(err);
    }
};

/**
 * Render the user login form
 */
module.exports.renderLogin = (req, res) => {
    res.render("users/login");
};

/**
 * Process user login
 */
module.exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            req.flash("error", "Please provide both email and password.");
            return res.redirect("/login");
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            req.flash("error", "Invalid email or password.");
            return res.redirect("/login");
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            req.flash("error", "Invalid email or password.");
            return res.redirect("/login");
        }

        // Generate JWT Token
        const token = jwt.sign(
            {
                _id: user._id,
                email: user.email,
                role: user.role,
                branch: user.branch,
            },
            process.env.JWT_SECRET || "academic_jwt_secret_default",
            { expiresIn: "7d" }
        );

        // Store JWT in HTTP-only Cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: "lax",
        });

        req.flash("success", "Welcome back!");
        const redirectUrl = req.session.returnTo || "/";
        delete req.session.returnTo;
        res.redirect(redirectUrl);
    } catch (err) {
        next(err);
    }
};

/**
 * Process user logout
 */
module.exports.logout = (req, res) => {
    res.clearCookie("token");
    req.flash("success", "Goodbye! You have been logged out.");
    res.redirect("/");
};
