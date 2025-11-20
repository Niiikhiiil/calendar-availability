import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Save, Camera, Mail, Building, User, Calendar } from "lucide-react";

import { apiUrls } from "../utils/apiUrl";
import Loader from "../components/ui/Loader";
import axiosInstance from "../axios/axiosInstance";

export default function Profile() {
  const { user, setUser } = useOutletContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    department: user?.department || "",
  });

  const handleSave = async () => {
    try {
      setIsLoading("Saving changes...");
      const res = await axiosInstance.put(apiUrls.updateUser, form);
      if (res?.data?.success) {
        setUser(res.data.data);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading("");
    }
  };

  return (
    <>
      {isLoading && <Loader message={isLoading} />}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800">My Profile</h1>
            <p className="text-gray-600 mt-2">
              Manage your personal information and preferences
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-5xl font-bold border-4 border-white shadow-2xl">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <button className="absolute bottom-2 right-2 bg-white/20 backdrop-blur p-3 rounded-full hover:bg-white/30 transition">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                {/* User Info */}
                <div className="text-center sm:text-left">
                  <h2 className="text-3xl font-bold">
                    {user?.name || "Your Name"}
                  </h2>
                  <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                    <Mail className="w-4 h-4" />
                    <span className="text-lg opacity-90">{user?.email}</span>
                  </div>
                  {user?.department && (
                    <div className="flex items-center gap-2 mt-2">
                      <Building className="w-4 h-4" />
                      <span className="text-lg">{user.department}</span>
                    </div>
                  )}
                </div>

                {/* Edit Button */}
                <div className="sm:ml-auto">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 transition shadow-lg"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setForm({
                            name: user.name,
                            email: user.email,
                            department: user.department,
                          });
                          setIsEditing(false);
                        }}
                        className="px-5 py-3 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 transition shadow-lg flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Details Form */}
            <div className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      placeholder="John Doe"
                    />
                  ) : (
                    <p className="text-lg text-gray-800 font-medium">
                      {user?.name || "Not set"}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <p className="text-lg text-gray-800 font-medium">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Cannot be changed
                  </p>
                </div>

                {/* Department */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Building className="w-4 h-4" />
                    Department
                  </label>
                  {isEditing ? (
                    <select
                      value={form.department}
                      onChange={(e) =>
                        setForm({ ...form, department: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    >
                      <option value="">Select Department</option>
                      <option value="IT">IT</option>
                      <option value="Marketing">Marketing</option>
                      <option value="HR">HR</option>
                      <option value="Development">Development</option>
                    </select>
                  ) : (
                    <p className="text-lg text-gray-800 font-medium">
                      {user?.department || "Not specified"}
                    </p>
                  )}
                </div>

                {/* Member Since */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </label>
                  <p className="text-lg text-gray-800 font-medium">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Unknown"}
                  </p>
                </div>
              </div>

              {/* Future Sections */}
              <div className="border-t pt-8 mt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Preferences
                </h3>
                <div className="grid md:grid-cols-2 gap-6 text-gray-600">
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <p className="font-medium">Time Zone</p>
                    <p className="text-sm mt-1">Asia/Kolkata (GMT+5:30)</p>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <p className="font-medium">Default View</p>
                    <p className="text-sm mt-1">Week View</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
