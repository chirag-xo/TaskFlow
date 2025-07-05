import React from 'react';
import { X, Activity, User, Clock } from 'lucide-react';

interface Activity {
  id: string;
  action: string;
  userId: string;
  taskId?: string;
  details: any;
  timestamp: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface ActivityPanelProps {
  activities: Activity[];
  users: User[];
  onClose: () => void;
}

const ActivityPanel: React.FC<ActivityPanelProps> = ({ activities, users, onClose }) => {
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getUserInitials = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'task_created':
        return '📝';
      case 'task_updated':
        return '✏️';
      case 'task_deleted':
        return '🗑️';
      case 'task_smart_assigned':
        return '🎯';
      case 'user_registered':
        return '👤';
      case 'user_logged_in':
        return '🔐';
      default:
        return '⚡';
    }
  };

  const getActivityText = (activity: Activity) => {
    const userName = getUserName(activity.userId);
    
    switch (activity.action) {
      case 'task_created':
        return `${userName} created task "${activity.details.title}"`;
      case 'task_updated':
        return `${userName} updated a task`;
      case 'task_deleted':
        return `${userName} deleted task "${activity.details.title}"`;
      case 'task_smart_assigned':
        return `${userName} used smart assign on a task`;
      case 'user_registered':
        return `${userName} joined the team`;
      case 'user_logged_in':
        return `${userName} logged in`;
      default:
        return `${userName} performed an action`;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg h-[600px] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Activity className="w-6 h-6 text-blue-500 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Activity Feed</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No activities yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {getUserInitials(activity.userId)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getActivityIcon(activity.action)}</span>
                      <p className="text-sm text-gray-900 truncate">
                        {getActivityText(activity)}
                      </p>
                    </div>
                    
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTime(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPanel;