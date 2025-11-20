// src/pages/Signup.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Building2,
  AlertCircle,
  UserPlus,
} from "lucide-react";

import { apiUrls } from "../utils/apiUrl";
import Loader from "../components/ui/Loader";
import axiosInstance from "../axios/axiosInstance";

export default function Signup({ setUser }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    const { name, email, password, department } = form;

    // NAME & EMAIL & PASSWORD VALIDATIONS
    if (!name.trim() || !email.trim() || !password || !department.trim()) {
      setError("Name, email, department and password are required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading("Creating your account...");

    try {
      const res = await axiosInstance.post(apiUrls.signupUser, {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        department: department.trim() || null,
      });

      if (res.data?.success) {
        setUser(res.data.user);
        navigate("/", { replace: true });
      } else {
        setError(res.data?.message || "Signup failed. Please try again.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to create account. Please try again.";
      setError(msg);
    } finally {
      setIsLoading("");
    }
  };

  return (
    <>
      {isLoading && <Loader message={isLoading} />}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 p-8 sm:p-10">
            {/* HEADER  */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-5 shadow-xl">
                <UserPlus className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome!</h1>
              <p className="text-gray-600 mt-2">
                Create your account to join the team
              </p>
            </div>

            {/* ERROR DISPLAY  */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* SIGN UP FORM  */}
            <form onSubmit={handleSignup} className="space-y-6">
              {/* FULL NAME  */}
              <div>
                <label
                  name="name"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full pl-12 pr-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              {/* EMAIL ADDRESS */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              {/* PASSWORD  */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Minimum 6 characters
                </p>
              </div>

              {/* DEPARTMENT  */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department{" "}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="department"
                    name="department"
                    type="text"
                    placeholder="Engineering, Sales, Design..."
                    value={form.department}
                    onChange={handleChange}
                    className="w-full pl-12 pr-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON  */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-6 w-6 text-white"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-6 h-6" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            {/* LOGIN LINK  */}
            <div className="mt-10 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          {/* FOOTER  */}
          <p className="mt-10 text-center text-xs text-gray-500">
            © 2025 Multi-User Calendar Availability. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}
