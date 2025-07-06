'use client';

import React, { useState } from 'react';
import { 
  RefreshCw, 
  Power, 
  KeyRound, 
  Play, 
  Pause, 
  Monitor
} from 'lucide-react';
import ServerService from '@/services/serverService';
import { useRouter } from 'next/navigation';
import VncModal from './VncModal';
import ChangePlanModal from './ChangePlanModal';

const ServerActions = ({ serverId, onActionComplete, serverStatus, isSuspended = false }) => {
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [vncModalOpen, setVncModalOpen] = useState(false);
  const [vncData, setVncData] = useState(null);
  const [changePlanModalOpen, setChangePlanModalOpen] = useState(false);
  const [serverData, setServerData] = useState(null);
  const router = useRouter();

  const handleAction = async (actionName, actionFn) => {
    try {
      setLoading(true);
      setActiveAction(actionName);
      await actionFn();
      if (onActionComplete) {
        onActionComplete({ message: `${actionName} initiated successfully.` });
      }
    } catch (error) {
      console.error(`Error executing ${actionName}:`, error);
      if (onActionComplete) {
        onActionComplete({ 
          message: `Failed to ${actionName.toLowerCase()}: ${error.message || 'An unknown error occurred'}`, 
          type: 'error' 
        });
      }
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  const actions = [
    {
      name: 'Change Plan',
      icon: <RefreshCw size={18} />,
      onClick: () => {
        // Fetch server data and open modal
        setServerData({ id: serverId, label: 'Server ' + serverId });
        setChangePlanModalOpen(true);
      }
    },
    {
      name: 'Reboot',
      icon: <Power size={18} />,
      onClick: () => handleAction('Reboot', () => ServerService.reboot(serverId))
    },
    {
      name: 'Rebuild',
      icon: <RefreshCw size={18} />,
      onClick: () => handleAction('Rebuild', () => ServerService.rebuild(serverId))
    },
    {
      name: 'Reset Password',
      icon: <KeyRound size={18} />,
      onClick: () => handleAction('Reset Password', () => ServerService.resetPassword(serverId))
    },
    {
      name: 'Start',
      icon: <Play size={18} />,
      onClick: () => handleAction('Start', () => ServerService.start(serverId))
    },
    {
      name: 'Stop',
      icon: <Power size={18} />,
      onClick: () => handleAction('Stop', () => ServerService.stop(serverId))
    },
    {
      name: 'Suspend',
      icon: <Pause size={18} />,
      onClick: () => handleAction('Suspend', () => ServerService.suspend(serverId))
    },
    {
      name: 'Unsuspend',
      icon: <Play size={18} />,
      onClick: () => handleAction('Unsuspend', () => ServerService.unsuspend(serverId))
    },
    {
      name: 'VNC Console',
      icon: <Monitor size={18} />,
      onClick: async () => {
        try {
          setLoading(true);
          setActiveAction('VNC Console');
          const response = await ServerService.getVnc(serverId);
          
          // Check if we have the VNC data in the expected format
          if (response?.data?.socket_hash && response?.data?.socket_password) {
            // Open in a popup window instead of modal
            const vncUrl = `/vnc-client.html?password=${encodeURIComponent(response.data.socket_password)}&path=${encodeURIComponent(response.data.socket_hash)}`;
            const windowFeatures = 'width=800,height=600,resizable=yes,scrollbars=yes,status=yes';
            window.open(vncUrl, 'vncConsole', windowFeatures);
            
            if (onActionComplete) {
              onActionComplete({ 
                message: 'VNC console opened successfully.', 
                type: 'success' 
              });
            }
          } 
          // Fallback to the old URL-based approach if that's what the API returns
          else if (response?.data?.url) {
            window.open(response.data.url, '_blank');
          } 
          else {
            throw new Error('Could not retrieve VNC connection data.');
          }
        } catch (error) {
          console.error('Error opening VNC console:', error);
          if (onActionComplete) {
            onActionComplete({ 
              message: `Failed to open VNC console: ${error.message || 'An unknown error occurred'}`, 
              type: 'error' 
            });
          }
        } finally {
          setLoading(false);
          setActiveAction(null);
        }
      }
    }
  ];

  // Determine which buttons should be disabled based on server status
  const isButtonDisabled = (actionName) => {
    if (loading) return true;
    
    // If server is running, disable Start and Unsuspend
    if (serverStatus === 'running') {
      return ['Start', 'Unsuspend'].includes(actionName);
    }
    
    // If server is suspended, only enable Unsuspend and Delete Server
    if (serverStatus === 'suspended' || isSuspended) {
      return !['Unsuspend', 'Delete Server'].includes(actionName);
    }
    
    // If server is stopped, disable Stop, Unsuspend, and Reboot
    if (serverStatus === 'stopped') {
      return ['Stop', 'Unsuspend', 'Reboot'].includes(actionName);
    }
    
    // If server is provisioning, only enable Delete Server
    if (serverStatus === 'provisioning') {
      return actionName !== 'Delete Server';
    }
    
    return false;
  };

  return (
    <>
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            disabled={loading || isButtonDisabled(action.name)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
              ${(loading && activeAction === action.name) || isButtonDisabled(action.name)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900'}
              transition-colors duration-200
            `}
          >
            {action.icon}
            {action.name}
            {loading && activeAction === action.name && (
              <span className="ml-1 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
            )}
          </button>
        ))}
        </div>
      </div>
      
      {/* VNC Modal */}
      <VncModal 
        isOpen={vncModalOpen} 
        onClose={() => setVncModalOpen(false)} 
        vncData={vncData}
      />
      
      {/* Change Plan Modal */}
      <ChangePlanModal
        isOpen={changePlanModalOpen}
        onClose={() => setChangePlanModalOpen(false)}
        onConfirm={(planId) => {
          setChangePlanModalOpen(false);
          handleAction('Change Plan', () => ServerService.changePlan(serverId, planId));
        }}
        server={serverData}
      />
    </>
  );
};

export default ServerActions;
