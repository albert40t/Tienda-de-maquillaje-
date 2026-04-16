import React, { useEffect, useState } from 'react';
import { ArrowLeft, Activity, Package, ShoppingCart, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ActivityLog {
  id: string;
  user_email: string;
  action_type: string;
  description: string;
  created_at: string;
}

interface ActivityLogsProps {
  onBack: () => void;
}

export default function ActivityLogs({ onBack }: ActivityLogsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (data) {
        setLogs(data);
      }
      setIsLoading(false);
    };

    fetchLogs();

    const channel = supabase.channel('activity-logs-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        setLogs(prev => [payload.new as ActivityLog, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getIconForAction = (actionType: string) => {
    switch (actionType) {
      case 'CREATE_PRODUCT': return <Package size={16} className="text-green-600" />;
      case 'UPDATE_PRODUCT': return <Edit2 size={16} className="text-blue-600" />;
      case 'DELETE_PRODUCT': return <Trash2 size={16} className="text-red-600" />;
      case 'NEW_SALE': return <ShoppingCart size={16} className="text-purple-600" />;
      default: return <Activity size={16} className="text-gray-600" />;
    }
  };

  const getBgForAction = (actionType: string) => {
    switch (actionType) {
      case 'CREATE_PRODUCT': return 'bg-green-100';
      case 'UPDATE_PRODUCT': return 'bg-blue-100';
      case 'DELETE_PRODUCT': return 'bg-red-100';
      case 'NEW_SALE': return 'bg-purple-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="h-full flex flex-col animate-in slide-in-from-right-8 fade-in duration-300 relative bg-gray-50">
      <div className="px-4 py-3 bg-white sticky top-0 z-10 border-b border-gray-100 flex items-center space-x-2">
        <button 
          onClick={onBack}
          className="p-1.5 -ml-1.5 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-gray-900">Registro de Actividad</h2>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-24">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-start space-x-3">
              <div className={`p-2 rounded-full mt-1 ${getBgForAction(log.action_type)}`}>
                {getIconForAction(log.action_type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{log.description}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500 font-medium">{log.user_email.split('@')[0]}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(log.created_at).toLocaleString('es-ES', { 
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Activity size={32} className="mx-auto text-gray-300 mb-3" />
            <p>No hay actividad registrada aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}
