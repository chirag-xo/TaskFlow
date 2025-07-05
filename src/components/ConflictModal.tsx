import React, { useState } from 'react';
import { X, AlertTriangle, GitMerge, RefreshCw } from 'lucide-react';

interface ConflictModalProps {
  conflictData: any;
  onResolve: (resolution: 'merge' | 'overwrite', data: any) => void;
  onClose: () => void;
}

const ConflictModal: React.FC<ConflictModalProps> = ({ conflictData, onResolve, onClose }) => {
  const [resolution, setResolution] = useState<'merge' | 'overwrite'>('merge');
  const [mergedData, setMergedData] = useState(conflictData.currentVersion);

  const handleResolve = () => {
    onResolve(resolution, {
      taskId: conflictData.currentVersion.id,
      taskData: resolution === 'merge' ? mergedData : conflictData.currentVersion
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-orange-500 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Conflict Detected</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Another user is currently editing this task. Please choose how to resolve this conflict:
          </p>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="resolution"
                value="merge"
                checked={resolution === 'merge'}
                onChange={() => setResolution('merge')}
                className="text-blue-500"
              />
              <GitMerge className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-medium">Merge Changes</div>
                <div className="text-sm text-gray-600">
                  Combine both versions and resolve conflicts manually
                </div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="resolution"
                value="overwrite"
                checked={resolution === 'overwrite'}
                onChange={() => setResolution('overwrite')}
                className="text-blue-500"
              />
              <RefreshCw className="w-5 h-5 text-orange-500" />
              <div>
                <div className="font-medium">Overwrite</div>
                <div className="text-sm text-gray-600">
                  Replace the current version with your changes
                </div>
              </div>
            </label>
          </div>
        </div>

        {resolution === 'merge' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">Merge Preview:</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Title:</span> {mergedData.title}
              </div>
              <div>
                <span className="font-medium">Description:</span> {mergedData.description}
              </div>
              <div>
                <span className="font-medium">Status:</span> {mergedData.status}
              </div>
              <div>
                <span className="font-medium">Priority:</span> {mergedData.priority}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center"
          >
            {resolution === 'merge' ? (
              <>
                <GitMerge className="w-4 h-4 mr-2" />
                Merge Changes
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Overwrite
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictModal;