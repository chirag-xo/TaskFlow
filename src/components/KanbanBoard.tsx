import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TaskCard from './TaskCard';
import ActivityPanel from './ActivityPanel';
import CreateTaskModal from './CreateTaskModal';
import ConflictModal from './ConflictModal';
import { Plus, LogOut, Users, Zap } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in progress' | 'done';
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Activity {
  id: string;
  action: string;
  userId: string;
  taskId?: string;
  details: any;
  timestamp: string;
}

const KanbanBoard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conflictData, setConflictData] = useState<any>(null);
  const [editingTasks, setEditingTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const socketConnection = io('http://localhost:3001');
    setSocket(socketConnection);

    socketConnection.on('task_created', (task: Task) => {
      setTasks(prev => [...prev, task]);
    });

    socketConnection.on('task_updated', (task: Task) => {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    });

    socketConnection.on('task_deleted', (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    });

    socketConnection.on('activity', (activity: Activity) => {
      setActivities(prev => [activity, ...prev.slice(0, 19)]);
    });

    socketConnection.on('user_editing', ({ taskId, userId }) => {
      setEditingTasks(prev => new Set(prev).add(taskId));
    });

    socketConnection.on('user_stopped_editing', ({ taskId }) => {
      setEditingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    });

    return () => {
      socketConnection.close();
    };
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchActivities();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/activities', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/tasks/${draggedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.status === 409) {
        const conflictData = await response.json();
        setConflictData(conflictData);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }

    setDraggedTask(null);
  };

  const handleSmartAssign = async (taskId: string) => {
    try {
      // Show loading state or feedback here if needed
      const response = await fetch(`http://localhost:3001/api/tasks/${taskId}/smart-assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to smart assign task');
      }
      
      // You could add a toast notification here for success feedback
      console.log('Task smart assigned successfully');
    } catch (error) {
      console.error('Failed to smart assign task:', error);
    }
  };

  const handleStartEditing = (taskId: string) => {
    socket?.emit('start_editing', { taskId, userId: user?.id });
  };

  const handleStopEditing = (taskId: string) => {
    socket?.emit('stop_editing', { taskId });
  };

  const handleResolveConflict = async (resolution: 'merge' | 'overwrite', data: any) => {
    try {
      const response = await fetch(`http://localhost:3001/api/tasks/${data.taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data.taskData),
      });

      if (response.ok) {
        setConflictData(null);
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const columns = [
    { id: 'todo', title: 'To Do', bgColor: 'bg-blue-50' },
    { id: 'in progress', title: 'In Progress', bgColor: 'bg-yellow-50' },
    { id: 'done', title: 'Done', bgColor: 'bg-green-50' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowActivityPanel(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </button>
              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {columns.map((column) => (
            <div
              key={column.id}
              className={`${column.bgColor} rounded-2xl p-6 min-h-[600px] shadow-lg border border-white/30`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
                {column.title}
                <span className="bg-white/50 text-gray-600 px-2 py-1 rounded-full text-sm">
                  {getTasksByStatus(column.id).length}
                </span>
              </h2>
              
              <div className="space-y-4">
                {getTasksByStatus(column.id).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    users={users}
                    onDragStart={() => handleDragStart(task)}
                    onSmartAssign={() => handleSmartAssign(task.id)}
                    onStartEditing={() => handleStartEditing(task.id)}
                    onStopEditing={() => handleStopEditing(task.id)}
                    isBeingEdited={editingTasks.has(task.id)}
                    currentUser={user}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          token={token}
          users={users}
        />
      )}

      {showActivityPanel && (
        <ActivityPanel
          activities={activities}
          users={users}
          onClose={() => setShowActivityPanel(false)}
        />
      )}

      {conflictData && (
        <ConflictModal
          conflictData={conflictData}
          onResolve={handleResolveConflict}
          onClose={() => setConflictData(null)}
        />
      )}
    </div>
  );
};

export default KanbanBoard;