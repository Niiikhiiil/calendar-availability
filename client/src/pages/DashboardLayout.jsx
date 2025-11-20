import { useState } from "react";
import { Outlet } from "react-router-dom";

import { apiUrls } from "../utils/apiUrl";
import Loader from "../components/ui/Loader";
import Sidebar from "../components/ui/Sidebar";
import axiosInstance from "../axios/axiosInstance";
import MobileHeader from "../components/ui/MobileHeader";

export default function DashboardLayout({ user, setUser }) {
  const [isLoading, setIsLoading] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading("Logging out...");
      await axiosInstance.post(apiUrls.logoutUser);
      setUser(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading("");
    }
  };

  return (
    <>
      {isLoading && <Loader message={isLoading} />}
      <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* SIDEBAR  */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
          activeTab={window.location.pathname.split("/")[1] || "my-calendar"}
          handleLogout={handleLogout}
        />

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MobileHeader
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          <main className="flex-1 overflow-auto">
            <Outlet context={{ user, setUser }} />
          </main>
        </div>
      </div>
    </>
  );
}
