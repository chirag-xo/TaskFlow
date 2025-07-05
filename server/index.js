import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (replace with Supabase in production)
const users = new Map();
const tasks = new Map();
const activities = [];
const activeEdits = new Map(); // Track who's editing what

const JWT_SECRET = 'your-secret-key-here';

// Helper functions
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const logActivity = (action, userId, taskId = null, details = {}) => {
  const activity = {
    id: uuidv4(),
    action,
    userId,
    taskId,
    details,
    timestamp: new Date().toISOString()
  };
  activities.unshift(activity);
  if (activities.length > 20) {
    activities.pop();
  }
  io.emit('activity', activity);
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  req.userId = decoded.userId;
  next();
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (users.has(email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      email,
      name,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.set(email, user);
    const token = generateToken(user.id);

    logActivity('user_registered', user.id);

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.get(email);

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    logActivity('user_logged_in', user.id);

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/tasks', authenticateToken, (req, res) => {
  const taskList = Array.from(tasks.values());
  res.json(taskList);
});

app.post('/api/tasks', authenticateToken, (req, res) => {
  try {
    const { title, description, priority = 'medium' } = req.body;
    
    // Validate unique title
    const existingTask = Array.from(tasks.values()).find(t => t.title === title);
    if (existingTask) {
      return res.status(400).json({ error: 'Task title must be unique' });
    }

    // Validate title doesn't match column names
    const columnNames = ['todo', 'in progress', 'done'];
    if (columnNames.includes(title.toLowerCase())) {
      return res.status(400).json({ error: 'Task title cannot match column names' });
    }

    const task = {
      id: uuidv4(),
      title,
      description,
      priority,
      status: 'todo',
      assignedTo: req.userId,
      createdBy: req.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    tasks.set(task.id, task);
    logActivity('task_created', req.userId, task.id, { title });

    io.emit('task_created', task);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const task = tasks.get(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check for conflicts
    const activeEdit = activeEdits.get(id);
    if (activeEdit && activeEdit.userId !== req.userId) {
      return res.status(409).json({ 
        error: 'Conflict detected',
        conflictingUser: activeEdit.userId,
        currentVersion: task
      });
    }

    const updates = req.body;
    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: task.version + 1
    };

    tasks.set(id, updatedTask);
    activeEdits.delete(id);
    
    logActivity('task_updated', req.userId, id, updates);
    io.emit('task_updated', updatedTask);

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const task = tasks.get(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    tasks.delete(id);
    activeEdits.delete(id);
    
    logActivity('task_deleted', req.userId, id, { title: task.title });
    io.emit('task_deleted', id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.post('/api/tasks/:id/smart-assign', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const task = tasks.get(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get all users and count their active tasks
    const userTaskCounts = new Map();
    Array.from(users.values()).forEach(user => {
      userTaskCounts.set(user.id, 0);
    });

    Array.from(tasks.values()).forEach(t => {
      if (t.status !== 'done' && t.assignedTo) {
        const count = userTaskCounts.get(t.assignedTo) || 0;
        userTaskCounts.set(t.assignedTo, count + 1);
      }
    });

    // Find user with fewest active tasks
    let minCount = Infinity;
    let assignToUser = null;
    
    userTaskCounts.forEach((count, userId) => {
      if (count < minCount) {
        minCount = count;
        assignToUser = userId;
      }
    });

    const updatedTask = {
      ...task,
      assignedTo: assignToUser,
      updatedAt: new Date().toISOString(),
      version: task.version + 1
    };

    tasks.set(id, updatedTask);
    
    logActivity('task_smart_assigned', req.userId, id, { assignedTo: assignToUser });
    io.emit('task_updated', updatedTask);

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to smart assign task' });
  }
});

app.get('/api/activities', authenticateToken, (req, res) => {
  res.json(activities);
});

app.get('/api/users', authenticateToken, (req, res) => {
  const userList = Array.from(users.values()).map(user => ({
    id: user.id,
    name: user.name,
    email: user.email
  }));
  res.json(userList);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('start_editing', (data) => {
    const { taskId, userId } = data;
    activeEdits.set(taskId, { userId, socketId: socket.id });
    socket.broadcast.emit('user_editing', { taskId, userId });
  });

  socket.on('stop_editing', (data) => {
    const { taskId } = data;
    activeEdits.delete(taskId);
    socket.broadcast.emit('user_stopped_editing', { taskId });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Clean up active edits for this socket
    for (const [taskId, edit] of activeEdits.entries()) {
      if (edit.socketId === socket.id) {
        activeEdits.delete(taskId);
        socket.broadcast.emit('user_stopped_editing', { taskId });
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});