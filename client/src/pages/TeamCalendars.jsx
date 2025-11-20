import moment from "moment";
import { io } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Check, Filter, Search, Users } from "lucide-react";

import { apiUrls } from "../utils/apiUrl";
import Loader from "../components/ui/Loader";
import axiosInstance, { base } from "../axios/axiosInstance";
import TeammateCalendar from "../components/calendars/TeammateCalendar";

const SOCKET_URL = base;

export default function TeamCalendars() {
  const { user } = useOutletContext();
  const [isLoading, setIsLoading] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const teammateCalendarRefs = useRef({});
  const socket = useRef(null);
  const [selectedUsers, setSelectedUsers] = useState({});
  const [userCalendars, setUserCalendars] = useState({});
  const [currentView, setCurrentView] = useState("timeGridWeek");
  const [currentRange, setCurrentRange] = useState({
    start:
      currentView === "timeGridWeek"
        ? moment().startOf("isoWeek").format("YYYY-MM-DD")
        : moment().startOf("month").format("YYYY-MM-DD"),
    end:
      currentView === "timeGridWeek"
        ? moment().endOf("isoWeek").format("YYYY-MM-DD")
        : moment().endOf("month").format("YYYY-MM-DD"),
  });

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter
      ? u.department === departmentFilter
      : true;
    return matchesSearch && matchesDept;
  });

  const getOtherUserEvents = async (user) => {
    try {
      setIsLoading(`Loading ${user.name}'s calendar...`);
      const start = moment(currentRange.start).format("YYYY-MM-DD");
      const end = moment(currentRange.end).format("YYYY-MM-DD");

      const res = await axiosInstance.get(
        apiUrls.getOtherUserAvailability(user.id, start, end)
      );
      if (res?.data?.success) {
        setUserCalendars(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading("");
    }
  };

  const toggleUserSelection = (u) => {
    setSelectedUsers(u);
    getOtherUserEvents(u);
  };

  useEffect(() => {
    socket.current = io(SOCKET_URL, { withCredentials: true });
    socket.current.on("availability-updated", () => {
      // getCurrentUserEvents();
      getOtherUserEvents(selectedUsers);
    });
    return () => socket.current?.disconnect();
  }, [selectedUsers]);

  useEffect(() => {
    const getAllUsers = async () => {
      try {
        setIsLoading("Loading teammates...");
        const res = await axiosInstance.get(apiUrls.getAllUsers);
        if (res?.data?.success) {
          setAllUsers(res.data.data.filter((u) => u.id !== user.id));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading("");
      }
    };
    getAllUsers();
  }, [user?.id]);

  return (
    <>
      {isLoading && <Loader message={isLoading} />}
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Team Calendars</h1>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          {!selectedUsers?.id && (
            <>
              <div className="p-4 space-y-4">
                {/* SEARCH */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-xl bg-white outline-0 placeholder:text-gray-700"
                  />
                </div>

                {/* FILTER */}
                <div className="relative">
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-xl bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="">All Departments</option>
                    {[...new Set(allUsers.map((u) => u.department))].map(
                      (dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* USER LIST */}
              <div className="flex-1 overflow-y-auto p-4">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-white">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No team members found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map((u) => {
                      const isSelected = selectedUsers?.id === u?.id;

                      return (
                        <label
                          key={u?.id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "bg-blue-100 backdrop-blur-lg shadow-sm shadow-blue/30"
                              : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                          }`}
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleUserSelection(u)}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected
                                  ? "bg-blue-500 border-blue-500"
                                  : "bg-white border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-1">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                isSelected
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-300 text-gray-700"
                              }`}
                            >
                              {u.name?.charAt(0).toUpperCase() +
                                (u?.name.split(" ")[1]
                                  ? u?.name
                                      .split(" ")[1]
                                      .charAt(0)
                                      .toUpperCase()
                                  : "")}
                            </div>

                            <span
                              className={`text-sm font-medium ${
                                isSelected ? "text-blue-900" : "text-gray-700"
                              }`}
                            >
                              {u.name.charAt(0).toUpperCase() +
                                u?.name?.slice(1)}
                              <span className="block text-xs italic text-gray-500">
                                {u.email} (
                                <span className="uppercase text-[10px]">
                                  {u?.department}
                                </span>
                                )
                              </span>
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {selectedUsers?.id && (
            <TeammateCalendar
              key={selectedUsers?.id}
              user={selectedUsers}
              calendarRef={(el) =>
                (teammateCalendarRefs.current[selectedUsers?.id] = el)
              }
              events={userCalendars || []}
              currentView={currentView}
              calendarRefAPI={teammateCalendarRefs.current[
                selectedUsers?.id
              ]?.getApi()}
              onViewChange={(view) => setCurrentView(view)}
              removeCalendar={() => setSelectedUsers({})}
            />
          )}
        </div>
      </div>
    </>
  );
}
