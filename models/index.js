import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema({
    type: String,
    url: String
}, { _id: false });

const activitySchema = new mongoose.Schema({
    message: String,
    timestamp: { type: Date, default: Date.now }
});

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
    //id: String, 
    name: String,
    role: { type: String, enum: ['Developer', 'Designer', 'Manager', 'QA'], default : "Developer" } ,
    index: Number,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}); 

const projectSchema = new mongoose.Schema({
    title: { type: String, unique: true, required: true },
    description: { type: String, required: true },
    task: [taskSchema],
    members: [memberSchema]
}, { timestamps: true });

export const Activity = mongoose.model("Activity", activitySchema);

export const Project = mongoose.model('Project', projectSchema);
