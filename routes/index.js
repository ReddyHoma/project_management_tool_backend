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
api.get('/project/:id', async (req, res) => {
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
api.post('/project', async (req, res) => {
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
api.put('/project/:id', async (req, res) => {
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
api.delete('/project/:id', async (req, res) => {
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
api.post('/project/:id/task', async (req, res) => {
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
api.get('/project/:id/task/:taskId', async (req, res) => {
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

// ✅ Delete a task
api.delete('/project/:id/task/:taskId', async (req, res) => {
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

export default api;
