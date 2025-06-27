import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BellIcon, UserCircleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
// ❌ Ya no se necesita MOCK_NOTIFICATIONS
// import { MOCK_NOTIFICATIONS } from '../../constants';
import { AppNotification } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // 🆕 Importar axios para llamadas al backend

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]); // 🆕 Usar estado real
  const [isOpen, setIsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // 🆕 Cargar notificaciones reales al montar el componente
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get('http://localhost:4000/api/notifications');
        setNotifications(res.data);
      } catch (error) {
        console.error('Error al obtener notificaciones:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // refresca cada 60s
    return () => clearInterval(interval);
  }, []);

  // 🆕 Contar cuántas no están leídas (tu endpoint ya entrega solo las no leídas)
  const unreadNotificationsCount = notifications.length;

  if (!currentUser) return null;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div>
            <h2 className="text-xl font-semibold text-gray-700">
              Bienvenido/a, {currentUser.name}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bioren-blue-light"
              >
                <span className="sr-only">Ver notificaciones</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 md:w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none max-h-96 overflow-y-auto">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b">
                      <h3 className="text-sm font-medium text-gray-900">Notificaciones</h3>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-500 px-4 py-3">No hay notificaciones nuevas.</p>
                    ) : (
                      notifications.map((notification: AppNotification) => (
                        <a
                          key={notification.id}
                          href={notification.link || '#'}
                          className={`block px-4 py-3 text-sm hover:bg-gray-100 border-b last:border-b-0 ${
                            notification.is_read
                              ? 'text-gray-500'
                              : 'text-gray-700 font-medium'
                          }`}
                          onClick={async (e) => {
                            e.preventDefault(); // evita navegación directa
                            try {
                              await axios.post(`http://localhost:4000/api/notifications/${notification.id}/read`);
                              setNotifications((prev) =>
                                prev.filter((n) => n.id !== notification.id)
                              );
                              setNotificationsOpen(false);
                            } catch (err) {
                              console.error('Error al marcar como leída:', err);
                            }
                          }}
                        >
                          <p
                            className={`font-semibold ${
                              notification.type === 'maintenance_overdue'
                                ? 'text-red-600'
                                : notification.type === 'maintenance_due'
                                ? 'text-yellow-600'
                                : notification.type === 'new_issue'
                                ? 'text-blue-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {notification.message}
                          </p>
                          {notification.details && (
                            <p className="text-xs text-gray-500">{notification.details}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(notification.created_at), 'MMM d, yyyy HH:mm', {
                              locale: es,
                            })}
                          </p>
                        </a>
                      ))
                    )}
                    <div className="px-4 py-2 border-t">
                      <button className="text-sm text-bioren-blue hover:underline w-full text-center">
                        Ver todas las notificaciones
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bioren-blue-light"
              >
                <span className="sr-only">Abrir menú de usuario</span>
                <UserCircleIcon className="h-8 w-8 text-gray-500" />
                <span className="ml-2 hidden md:block text-gray-700">
                  {currentUser.name} ({currentUser.role})
                </span>
              </button>
              {userMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2 text-gray-500" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
