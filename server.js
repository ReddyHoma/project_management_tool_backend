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
const allowedOrigins = process.env.CORS_ORIGIN.split(",");

const app = express();

// Dynamic CORS Configuration
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log("✅ Loading API routes...");
app.use("/", api);

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
