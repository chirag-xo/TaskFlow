# 🚀 TaskFlow – Smart Kanban Task Manager

**TaskFlow** is a real-time, collaborative Kanban board that helps teams manage tasks more efficiently. It includes intelligent task assignment, live updates, and conflict handling to ensure smooth teamwork.

> 🔗 [GitHub Repo](https://github.com/chirag-xo/TaskFlow)

---

## 🧾 Project Overview

TaskFlow is a full-stack task management app built for teams. It features:
- Drag-and-drop Kanban board
- Real-time updates with Socket.IO
- Smart task assignment based on workload
- Conflict handling when multiple users edit the same task
- Clean UI with responsive design

---

## 🛠 Tech Stack

### Frontend:
- React.js
- TypeScript
- Tailwind CSS
- Socket.IO Client

### Backend:
- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js and npm installed
- MongoDB running locally (or use a cloud instance)
- Git

### Clone the Repository
```bash
git clone https://github.com/chirag-xo/TaskFlow.git
cd TaskFlow
```

✨ Features & Usage
✅ Core Features:
Kanban board with drag-and-drop tasks across columns

Real-time sync using WebSockets (Socket.IO)

Smart Assign to auto-assign tasks based on team workload

Conflict Handling with merge/overwrite modal

Activity logs and status tracking

Responsive UI for desktop & mobile

🔄 Usage:
Create and manage tasks in real-time

Click Smart Assign to let the system auto-assign the task

If someone else is editing a task, TaskFlow prevents overwrites with a clear conflict resolution popup

🤖 Smart Assign Logic
The Smart Assign feature evenly distributes tasks by workload:

When clicked, the frontend sends a request to the backend with the task ID.

The backend:

Fetches all users and their current active tasks.

Finds the user with the fewest active (not done) tasks.

Assigns the task to that user.

Updates the task and broadcasts the change via Socket.IO.

All users see the update in real-time — no refresh needed!

✅ Ensures fair task distribution across the team.

⚔️ Conflict Handling Logic
To avoid data loss when multiple users edit the same task:

When a user interacts with a task, a WebSocket signal marks it as "editing".

If another user tries to edit it:

The backend checks for conflicts and returns a 409 error if detected.

The frontend shows a Conflict Modal with:

Merge: Accept current server version

Overwrite: Push your own changes

The selected option is processed and synced in real-time to all users.

Built with ❤️ by Chirag Sachdeva
Connect on LinkedIn - https://www.linkedin.com/in/chirag-sachdeva007/
