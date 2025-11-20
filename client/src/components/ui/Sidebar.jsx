import { Calendar, Users, User, LogOut, Settings, X } from "lucide-react";
import LogoImage from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Sidebar = ({ sidebarOpen, setSidebarOpen, user, handleLogout }) => {
  const [activeTab, setActiveTab] = useState("/my-calendar");
  const navigate = useNavigate();
  const tabs = [
    { id: "/my-calendar", label: "My Calendar", icon: Calendar },
    ...(user?.role === "ADMIN"
      ? [{ id: "/other-calendar", label: "Others Calendars", icon: Users }]
      : []),
    { id: "/profile", label: "Profile", icon: User },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    navigate(tabId);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } flex flex-col`}
      >
        {/* Logo + Close */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={LogoImage}
                alt="Logo"
                className="w-10 h-10 rounded-lg shadow-md"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Calendly Pro
                </h1>
                <p className="text-xs text-gray-500">Multi-user Sync</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Current User */}
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <li key={tab.id}>
                  <button
                    onClick={() => handleTabClick(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left
                      transition-all duration-200 group
                      ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-lg"
                          : "text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
                      }
                    `}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive
                          ? "text-white"
                          : "text-gray-500 group-hover:text-indigo-600"
                      }`}
                    />
                    <span className="font-medium">{tab.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-8 bg-white rounded-l-full opacity-50" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
