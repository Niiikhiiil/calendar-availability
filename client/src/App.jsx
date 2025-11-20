
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardLayout from "./pages/DashboardLayout"; // ← New layout wrapper
import MyCalendar from "./pages/MyCalendar";
import TeamCalendars from "./pages/TeamCalendars";
import Profile from "./pages/Profile";
// import Settings from "./pages/Settings";

import Loader from "./components/ui/Loader";
import axiosInstance from "./axios/axiosInstance";
import { apiUrls } from "./utils/apiUrl";

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading("Fetching user data...");
        const res = await axiosInstance.get(apiUrls.getCurrentUser);
        if (res?.data?.success) {
          setUser(res.data.data);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.log("Not authenticated");
        setUser(null);
      } finally {
        setIsLoading("");
      }
    };

    fetchUser();
  }, []);

  if (isLoading) {
    return <Loader message={isLoading} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={!user ? <Login setUser={setUser} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/signup"
          element={!user ? <Signup setUser={setUser} /> : <Navigate to="/" replace />}
        />

        {/* Protected Routes - Dashboard Layout */}
        <Route
          path="/"
          element={user ? <DashboardLayout user={user} setUser={setUser} /> : <Navigate to="/login" replace />}
        >
          {/* Default route */}
          <Route index element={<MyCalendar user={user} />} />

          {/* Nested Pages */}
          <Route path="/my-calendar" element={<MyCalendar user={user} />} />
          <Route path="/other-calendar" element={<TeamCalendars user={user} />} />
          <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
          {/* <Route path="settings" element={<Settings user={user} />} /> */}

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;