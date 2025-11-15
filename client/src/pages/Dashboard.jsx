import moment from "moment";
import { RRule } from "rrule";
import { io } from "socket.io-client";
import { useState, useEffect, useRef } from "react";

import { apiUrls } from "../utils/apiUrl";
import Loader from "../components/ui/Loader";
import Sidebar from "../components/ui/Sidebar";
import axiosInstance, { base } from "../axios/axiosInstance";
import MobileHeader from "../components/ui/MobileHeader";
import ProfileModal from "../components/ui/ProfileModal";
import OwnCalendar from "../components/calendars/OwnCalendar";
import AvailabilityModal from "../components/ui/AvailabilityModal";
import TeammateCalendar from "../components/calendars/TeammateCalendar";

const SOCKET_URL = base;

export default function Dashboard({ user, setUser }) {
    const [isLoading, setIsLoading] = useState("");
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [currentRange, setCurrentRange] = useState({
        start: moment().startOf("isoWeek").format("YYYY-MM-DD"),
        end: moment().endOf("isoWeek").format("YYYY-MM-DD"),
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [currentView, setCurrentView] = useState("timeGridWeek");
    const [errors, setErrors] = useState({});

    const [modalOpen, setModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);

    const [form, setForm] = useState({
        description: "",
        start: "",
        end: "",
        status: "AVAILABLE",
        recurrence: "NONE",
        interval: 1,
        until: "",
    });
    const [editForm, setEditForm] = useState({
        name: user?.name || "",
        department: user?.department || ""
    });
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [userCalendars, setUserCalendars] = useState({});
    const socket = useRef(null);
    const calendarRef = useRef(null);
    const teammateCalendarRefs = useRef({});

    const filteredUsers = allUsers.filter((u) => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDept = departmentFilter ? u.department === departmentFilter : true;

        return matchesSearch && matchesDept;
    });


    // INITIALIZE SOCKET
    useEffect(() => {
        socket.current = io(SOCKET_URL, { withCredentials: true });
        socket.current.on("availability-updated", () => {
            getCurrentUserEvents();
            selectedUsers.forEach((u) => getOtherUserEvents(u));
        });

        return () => socket.current.disconnect();
    }, [selectedUsers]);

    // GET ALL USERS
    useEffect(() => {
        const getAllUsers = async () => {
            try {
                setIsLoading("Loading users...")
                const res = await axiosInstance.get(apiUrls?.getAllUsers);
                if (res?.data?.success) {
                    setAllUsers(res?.data?.data?.filter((u) => u.id !== user.id));
                } else {
                    setAllUsers([]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading("");
            }
        };
        getAllUsers();
    }, []);

    // GET CURRENT USER EVENTS
    const getCurrentUserEvents = async (loading = false) => {
        try {
            const start = currentRange.start
            const end = currentRange.end
            setIsLoading(loading ? "Loading your availability events..." : "")
            const res = await axiosInstance.get(apiUrls?.getCurrentUserAvailability(start, end));

            if (res?.data?.success) {
                const mapped = res?.data?.data?.map((av) => ({
                    id: av.id.toString(),
                    title: av.status,
                    description: av.description,
                    start: av.start,
                    end: av.end,
                    backgroundColor: av?.backgroundColor || "#3b82f6",
                    borderColor: av?.borderColor || "#2563eb",
                    recurringRule: av.recurringRule || "",
                }));
                setEvents(mapped);
            } else {
                setEvents([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading("");
        }
    };

    useEffect(() => {
        getCurrentUserEvents(true);
    }, [currentRange]);

    console.log('events', events)

    // GET OTHER USER'S CALENDAR EVENTS
    const getOtherUserEvents = async (user) => {
        try {
            setIsLoading(`Loading ${user?.name}'s availability...`)
            const res = await axiosInstance.get(apiUrls?.getOtherUserAvailability(user?.id, currentRange.start, currentRange.end));

            if (res?.data?.success) {
                const mapped = res?.data?.data?.map((av) => ({
                    id: av.id.toString(),
                    title: av.status,
                    description: av.description,
                    start: av.start,
                    end: av.end,
                    backgroundColor: av?.backgroundColor || "#3b82f6",
                    borderColor: av?.borderColor || "#2563eb",
                    recurringRule: av.recurringRule || "",
                }));
                setUserCalendars((prev) => ({ ...prev, [user.id]: mapped }));
            } else {
                setUserCalendars((prev) => ({ ...prev, [user.id]: [] }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading("");
        }
    };

    // TOGGLE USER SELECTION
    const toggleUserSelection = (u) => {
        if (selectedUsers.some((sel) => sel.id === u.id)) {
            setSelectedUsers(selectedUsers.filter((sel) => sel.id !== u.id));
            setUserCalendars((prev) => {
                const newState = { ...prev };
                delete newState[u.id];
                return newState;
            });
            // Clean up ref
            delete teammateCalendarRefs.current[u.id];
        } else {
            setSelectedUsers([...selectedUsers, u]);
            getOtherUserEvents(u);
        }
    };

    // SELECT TIME RANGE TO CREATE EVENT
    const handleDateTimeSelect = (selectInfo) => {
        setForm({
            description: "",
            start: moment(selectInfo.start).format("YYYY-MM-DDTHH:mm:ss"),
            end: moment(selectInfo.end).format("YYYY-MM-DDTHH:mm:ss"),
            status: "AVAILABLE",
            recurrence: "NONE",
            interval: 1,
            until: "",
        });
        setSelectedEvent(null);
        setModalOpen(true);
    };

    // CLICK ON EVENT TO EDIT
    const handleEventClick = (clickInfo) => {
        const ev = events.find((e) => e.id === clickInfo.event._def.publicId);
        if (!ev) return;

        let recurrence = "NONE";
        let interval = 1;
        let until = "";

        if (ev.recurringRule) {
            try {
                const rule = RRule.fromString(ev.recurringRule);
                if (rule.options.freq === RRule.DAILY) recurrence = "DAILY";
                else if (rule.options.freq === RRule.WEEKLY) recurrence = "WEEKLY";
                else if (rule.options.freq === RRule.MONTHLY) recurrence = "MONTHLY";

                interval = rule.options.interval || 1;
                if (rule.options.until) until = moment(rule.options.until).format("YYYY-MM-DD");
            } catch (err) {
                console.error("Failed to parse recurrence rule", err);
            }
        }

        setForm({
            description: ev.description,
            start: moment(ev.start).format("YYYY-MM-DDTHH:mm:ss"),
            end: moment(ev.end).format("YYYY-MM-DDTHH:mm:ss"),
            status: ev.title || "AVAILABLE",
            recurrence,
            interval,
            until,
        });

        setSelectedEvent(ev);
        setModalOpen(true);
    };

    // SUBMIT CREATE/UPDATE EVENT
    const handleSubmit = async () => {
        try {
            let tempErrors = {};

            if (!form.description?.trim()) {
                tempErrors.description = "Description is required";
            }

            if (!form.start || !form.end || moment(form.start).isSameOrAfter(moment(form.end))) {
                tempErrors.time = "Start time must be before end time";
            }

            if (form.recurrence !== "NONE") {
                if (!form.until) {
                    tempErrors.until = "Until date is required for recurring events";
                } else if (moment(form.until).isBefore(moment(form.start), "day")) {
                    tempErrors.until = "Until date must be after the start date";
                }
            }

            if (Object.keys(tempErrors).length > 0) {
                setErrors(tempErrors);
                return;
            }

            setErrors({});
            setIsLoading(selectedEvent ? "Updating availability..." : "Saving availability...")

            let recurringRule = "";
            if (form.recurrence !== "NONE") {
                const ruleOptions = {
                    freq: form.recurrence === "DAILY" ? RRule.DAILY : RRule.WEEKLY,
                    interval: Number(form.interval) || 1,
                    dtstart: moment(form.start).toDate(),
                };

                if (form.until) {
                    ruleOptions.until = moment(form.until).endOf("day").toDate();
                }

                recurringRule = new RRule(ruleOptions).toString();
            }

            const payload = {
                description: form.description,
                start: form.start,  // convert to UTC ISO string
                end: form.end,    // convert to UTC ISO string
                status: form.status,
                recurringRule,
            };
            let res;

            console.log('payload', payload)

            if (selectedEvent) {
                res = await axiosInstance.put(apiUrls?.updateAvailability(selectedEvent.id), payload);
            } else {
                res = await axiosInstance.post(apiUrls?.createAvailability, payload);
            }

            if (res?.data?.success) {
                socket.current.emit("availabilityChanged");
                setModalOpen(false);
                getCurrentUserEvents(true);
            } else {
                console.error('Failed to save availability!');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading("");
        }
    };

    // DELETE EVENT
    const handleDelete = async () => {
        if (!selectedEvent) return;
        try {
            setIsLoading("Deleting availability...");
            const res = await axiosInstance.delete(apiUrls?.deleteAvailability(selectedEvent.id));
            if (res?.data?.success) {
                socket.current.emit("availability-updated");
                setModalOpen(false);
                getCurrentUserEvents(true);
            } else {
                console.error('Failed to delete availability!');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading("");
        }
    };

    // LOGOUT USER
    const handleLogout = async () => {
        try {
            setIsLoading("Logging out...");
            const res = await axiosInstance.post(apiUrls?.logoutUser);
            if (res?.data?.success) {
                setUser(null);
            } else {
                console.error('Failed to logout!');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading("");
        }
    };

    // UPDATE CURRENT USER PROFILE
    const UpdateUserProfile = async (userForm) => {
        try {
            setIsLoading("Updating profile...");
            const res = await axiosInstance.put(apiUrls?.updateUser, userForm);
            if (res?.data?.success) {
                setUser(res?.data?.data);
                setProfileModalOpen(false);
            } else {
                console.error('Failed to update profile!');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading("");
        }
    }

    return (
        <>
            {isLoading && (<Loader message={isLoading} />)}
            <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-blue-100 to-indigo-200 backdrop-blur-2xl">

                {/* MOBILE HEADER  */}
                <MobileHeader
                    title="Multi-user Calendar Availability"
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                />

                {/* SIDEBAR  */}
                <Sidebar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    user={user}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    departmentFilter={departmentFilter}
                    setDepartmentFilter={setDepartmentFilter}
                    allUsers={allUsers}
                    filteredUsers={filteredUsers}
                    selectedUsers={selectedUsers}
                    toggleUserSelection={toggleUserSelection}
                    setProfileModalOpen={setProfileModalOpen}
                    handleLogout={handleLogout}
                />

                <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
                    <div className="max-w-full mx-auto">
                        <div className="mb-6 hidden md:block">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                                Team Calendar
                            </h1>
                            <p className="text-gray-600">
                                Manage your availability and view team schedules
                            </p>
                        </div>

                        {/* CALENDARS GRID  */}
                        <div className={`grid gap-4 sm:gap-6 sm:grid-cols-1 ${selectedUsers.length >= 1 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>

                            {/* CURRENT USER'S CALENDAR  */}
                            <OwnCalendar
                                user={user}
                                calendarRef={calendarRef}
                                currentView={currentView}
                                setCurrentView={setCurrentView}
                                events={events}
                                handleDateSelect={handleDateTimeSelect}
                                handleEventClick={handleEventClick}
                                setCurrentRange={setCurrentRange}
                            />
                            {/* OTHER USERS' CALENDARS  */}
                            {selectedUsers?.map((u) => {
                                const refKey = u.id;

                                return (
                                    <TeammateCalendar
                                        key={u.id}
                                        user={u}
                                        calendarRefAPI={teammateCalendarRefs.current[refKey]?.getApi()}
                                        calendarRef={(el) => (teammateCalendarRefs.current[refKey] = el)}
                                        events={userCalendars[u.id] || []}
                                        onViewChange={(view) => setCurrentView(view)}
                                        currentView={currentView}
                                        removeCalendar={toggleUserSelection}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </main>

                {/* EVENT MODALS  */}
                <AvailabilityModal
                    modalOpen={modalOpen}
                    setModalOpen={setModalOpen}
                    selectedEvent={selectedEvent}
                    form={form}
                    setForm={setForm}
                    errors={errors}
                    handleSubmit={handleSubmit}
                    handleDelete={handleDelete}
                />

                {/* PROFILE MODAL  */}
                <ProfileModal
                    profileModalOpen={profileModalOpen}
                    setProfileModalOpen={setProfileModalOpen}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    UpdateCurrentUser={UpdateUserProfile}
                />
            </div>
        </>
    );
}