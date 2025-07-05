import React, { useState } from 'react';
import { User, Zap, Edit, Trash2, AlertCircle } from 'lucide-react';

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

interface TaskCardProps {
  task: Task;
  users: User[];
  onDragStart: () => void;
  onSmartAssign: () => void;
  onStartEditing: () => void;
  onStopEditing: () => void;
  isBeingEdited: boolean;
  currentUser: any;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  users,
  onDragStart,
  onSmartAssign,
  onStartEditing,
  onStopEditing,
  isBeingEdited,
  currentUser
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200';
      case 'medium': return 'border-yellow-200';
      case 'low': return 'border-green-200';
      default: return 'border-gray-200';
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unassigned';
  };

  const getUserInitials = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMouseEnter = () => {
    setShowActions(true);
    onStartEditing();
  };

  const handleMouseLeave = () => {
    setShowActions(false);
    onStopEditing();
  };

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-300 ${
        isFlipped ? 'transform-gpu' : ''
      }`}
      draggable
      onDragStart={onDragStart}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      <div className={`relative w-full h-32 transition-transform duration-500 transform-gpu ${
        isFlipped ? 'rotate-y-180' : ''
      }`}>
        {/* Front of card */}
        <div className={`absolute inset-0 backface-hidden bg-white rounded-xl shadow-md border-2 ${
          getPriorityBorder(task.priority)
        } p-4 hover:shadow-lg transition-shadow duration-200 ${
          isBeingEdited ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
        }`}>
          {isBeingEdited && (
            <div className="absolute top-2 right-2">
              <AlertCircle className="w-4 h-4 text-blue-500" />
            </div>
          )}
          
          <div className="flex items-start justify-between mb-2">
            <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
            <div className="flex items-center space-x-1">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                {getUserInitials(task.assignedTo)}
              </div>
            </div>
          </div>
          
          <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
            {task.title}
          </h3>
          
          <p className="text-gray-600 text-xs line-clamp-2">
            {task.description}
          </p>
          
          {/* Action buttons */}
          <div className={`absolute top-2 right-2 flex space-x-1 transition-all duration-200 ${
            showActions ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSmartAssign();
              }}
              className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
              title="Smart Assign"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        {/* Back of card */}
        <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-md border-2 ${
          getPriorityBorder(task.priority)
        } p-4`}>
          <div className="h-full flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Details</span>
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
              </div>
              
              <div className="space-y-1.5">
                <div>
                  <span className="text-xs text-gray-500">Assigned to:</span>
                  <p className="text-xs font-medium truncate">{getUserName(task.assignedTo)}</p>
                </div>
                
                <div>
                  <span className="text-xs text-gray-500">Priority:</span>
                  <p className="text-xs font-medium capitalize">{task.priority}</p>
                </div>
                
                <div>
                  <span className="text-xs text-gray-500">Status:</span>
                  <p className="text-xs font-medium capitalize">{task.status}</p>
                </div>
                
                <div>
                  <span className="text-xs text-gray-500">Description:</span>
                  <p className="text-xs font-medium line-clamp-2 mt-1">{task.description || 'No description'}</p>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-400 mt-2">
              Created: {new Date(task.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;