import express from 'express';
import joi from 'joi';
import mongoose from 'mongoose';
import Project from '../models/index.js';



const api = express.Router();

// ✅ Root API Check
api.get("/", (req, res) => {
    res.send("✅ API is working!");
});

// ✅ Get all projects
api.get('/projects', async (req, res) => {
    try {
        const data = await Project.find({}, { task: 0, __v: 0, updatedAt: 0 });
        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }
});

// ✅ Get a single project by ID
api.get('/projects/:id', async (req, res) => {
    if (!req.params.id) return res.status(400).json({ error: true, message: "ID is required" });

    try {
        const data = await Project.findById(req.params.id);
        if (!data) return res.status(404).json({ error: true, message: "Project not found" });

        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }
});

// ✅ Create a new project
api.post('/projects', async (req, res) => {
    const schema = joi.object({
        title: joi.string().min(3).max(30).required(),
        description: joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(422).json({ error: true, message: error.details[0].message });

    try {
        const project = new Project(value);
        const data = await project.save();
        res.json({ message: "Project created successfully", data });
    } catch (e) {
        if (e.code === 11000) {
            return res.status(422).json({ error: true, message: "Title must be unique" });
        }
        return res.status(500).json({ error: true, message: "Server error" });
    }
});

// ✅ Update an existing project

api.put('/projects/:id', async (req, res) => {
    console.log("Received Update Request:", req.body);

    if (!req.params.id) return res.status(400).json({ error: true, message: "ID is required" });

    const schema = joi.object({
        title: joi.string().min(3).max(30).required(),
        description: joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(422).json({ error: true, message: error.details[0].message });

    try {
        const data = await Project.findByIdAndUpdate(req.params.id, value, { new: true });
        if (!data) return res.status(404).json({ error: true, message: "Project not found" });

        res.json({ message: "Project updated successfully", data });
    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }
});

// ✅ Delete a project
api.delete('/projects/:id', async (req, res) => {
    if (!req.params.id) return res.status(400).json({ error: true, message: "ID is required" });

    try {
        const data = await Project.findByIdAndDelete(req.params.id);
        if (!data) return res.status(404).json({ error: true, message: "Project not found" });

        res.json({ message: "Project deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }
});

// ✅ Add a task to a project
api.post('/projects/:id/tasks', async (req, res) => {
    if (!req.params.id) return res.status(400).json({ error: true, message: "Project ID is required" });

    const schema = joi.object({
        title: joi.string().min(3).max(30).required(),
        description: joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(422).json({ error: true, message: error.details[0].message });

    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: true, message: "Project not found" });

        const newTask = {
            ...value,
            stage: "Requested",
            order: project.task.length,
            index: project.task.length > 0 ? Math.max(...project.task.map(o => o.index)) + 1 : 0,
        };

        project.task.push(newTask);
        await project.save();

        res.json({ message: "Task added successfully", task: newTask });
    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }
});

// ✅ Get a task by ID
api.get('/projects/:id/tasks/:taskId', async (req, res) => {
    if (!req.params.id || !req.params.taskId) return res.status(400).json({ error: true, message: "Project ID and Task ID are required" });

    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: true, message: "Project not found" });

        const task = project.task.find(t => t._id.toString() === req.params.taskId);
        if (!task) return res.status(404).json({ error: true, message: "Task not found" });

        res.json(task);
    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }
});

// ✅ Get all tasks for a specific project
api.get('/projects/:id/tasks', async (req, res) => {
    if (!req.params.id) {
        return res.status(400).json({ error: true, message: "Project ID is required" });
    }

    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: true, message: "Project not found" });
        }

        // 🛠️ Group tasks by their stage
        const groupedTasks = {
            requested: project.task.filter((t) => t.stage === "Requested"),
            todo: project.task.filter((t) => t.stage === "To Do"),
            inProgress: project.task.filter((t) => t.stage === "In Progress"),
            completed: project.task.filter((t) => t.stage === "Completed"),
        };

        console.log("Grouped Tasks Response:", groupedTasks);  // ✅ Debugging output
        res.json(groupedTasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return res.status(500).json({ error: true, message: error.message });
    }
});

api.put('/projects/:id/tasks/:taskId', async (req, res) => {
    if (!req.params.id || !req.params.taskId) {
        return res.status(400).json({ error: true, message: "Project ID and Task ID are required" });
    }

    const schema = joi.object({
        title: joi.string().min(3).max(30).optional(),
        description: joi.string().optional(),
        stage: joi.string().valid("Requested", "To Do", "In Progress", "Completed").optional(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(422).json({ error: true, message: error.details[0].message });

    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: true, message: "Project not found" });

        const taskIndex = project.task.findIndex(t => t._id.toString() === req.params.taskId);
        if (taskIndex === -1) return res.status(404).json({ error: true, message: "Task not found" });

        // Update only the fields provided in the request
        Object.assign(project.task[taskIndex], value);
        await project.save();

        res.json({ message: "Task updated successfully", task: project.task[taskIndex] });
    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }
});

// ✅ Delete a task
api.delete('/projects/:id/tasks/:taskId', async (req, res) => {
    if (!req.params.id || !req.params.taskId) return res.status(400).json({ error: true, message: "Project ID and Task ID are required" });

    try {
        const data = await Project.findByIdAndUpdate(
            req.params.id,
            { $pull: { task: { _id: mongoose.Types.ObjectId(req.params.taskId) } } },
            { new: true }
        );
        if (!data) return res.status(404).json({ error: true, message: "Project not found or task missing" });

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }
});

// ✅ Add a member to a project
api.post('/projects/:id/members', async (req, res) => {
    const { id, name, role } = req.body;

    if (!id || !name || !role) return res.status(400).json({ error: true, message: "Member ID, name, and role are required" });

    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: true, message: "Project not found" });

        const newMember = { id, name, role };

        project.members.push(newMember);
        await project.save();

        res.json({ message: "Member added successfully", member: newMember });
    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }
});

// ✅ Move a member to another project
api.put('/projects/:id/members/:id', async (req, res) => {
    const { newProjectId } = req.body;

    if (!newProjectId || !mongoose.Types.ObjectId.isValid(newProjectId)) {
        return res.status(400).json({ error: true, message: "Invalid new project ID" });
    }

    try {
        const sourceProject = await Project.findById(req.params.id);
        if (!sourceProject) return res.status(404).json({ error: true, message: "Source project not found" });

        if (!Array.isArray(sourceProject.members)) {
            return res.status(500).json({ error: true, message: "Invalid members array" });
        }

        const memberIndex = sourceProject.members.findIndex(m => m.id === req.params.memberId);
        if (memberIndex === -1) return res.status(404).json({ error: true, message: "Member not found in the source project" });

        const memberToMove = sourceProject.members.splice(memberIndex, 1)[0]; // Remove member from source project
        await sourceProject.save();

        const destinationProject = await Project.findById(newProjectId);
        if (!destinationProject) return res.status(404).json({ error: true, message: "Destination project not found" });

        destinationProject.members.push(memberToMove);
        await destinationProject.save();

        res.json({ message: "Member moved successfully", member: memberToMove });
    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }
});


// ✅ Get all members of a specific project
api.get('/projects/:id/members', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: true, message: "Project not found" });

        res.json({ members: project.members });
    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }
});

export default api;
