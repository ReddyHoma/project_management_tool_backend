import express from "express";
import api from "./routes/index.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

dotenv.config();

// MongoDB Connection
mongoose.connect(process.env.MONGODB_PATH, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ MongoDB Connected Successfully");
}).catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
});

const PORT = process.env.SERVER_PORT || 9000;
const origin = process.env.CORS_ORIGIN || "http://localhost:3000";

const app = express();

app.use(cors({ origin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug: Log when API routes are loaded
console.log("✅ Loading API routes...");
app.use("/api", api);

// Default Home Route
app.get("/", (req, res) => {
    res.send("Backend is running!");
});

// Log all defined routes
app._router.stack.forEach((middleware) => {
    if (middleware.route) {
        console.log(`✅ ${middleware.route.stack[0].method.toUpperCase()} ${middleware.route.path}`);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Your app is running on http://localhost:${PORT}`);
});
