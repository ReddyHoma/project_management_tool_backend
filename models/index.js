import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema({
    type: String,
    url: String
}, { _id: false });

const taskSchema = new mongoose.Schema({
    title: String,
    description: String,
    order: Number,
    stage: { type: String, enum: ["Requested", "To Do", "In Progress", "Completed"], default: "Requested" },
    index: Number,
    attachment: [attachmentSchema],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const memberSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Unique identifier for the member
    name: { type: String, required: true },
    role: { type: String, enum: ['Developer', 'Designer', 'Manager', 'QA'], required: true } // Role of the member
}, { timestamps: true }); // Timestamps for member creation and update

const projectSchema = new mongoose.Schema({
    title: { type: String, unique: true, required: true },
    description: { type: String, required: true },
    task: [taskSchema],
    members: [memberSchema]
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
