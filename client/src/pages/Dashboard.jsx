// import moment from "moment";
// import { io } from "socket.io-client";
// import { useState, useEffect, useRef } from "react";
// import Swal from "sweetalert2";

// import { apiUrls } from "../utils/apiUrl";
// import Loader from "../components/ui/Loader";
// import Sidebar from "../components/ui/Sidebar";
// import axiosInstance, { base } from "../axios/axiosInstance";
// import MobileHeader from "../components/ui/MobileHeader";
// import ProfileModal from "../components/ui/ProfileModal";
// import OwnCalendar from "../components/calendars/OwnCalendar";
// import AvailabilityModal from "../components/ui/AvailabilityModal";
// import TeammateCalendar from "../components/calendars/TeammateCalendar";

// const SOCKET_URL = base;

// export default function Dashboard({ user, setUser }) {
//     const [isLoading, setIsLoading] = useState("");
//     const [events, setEvents] = useState([]);
//     const [selectedEvent, setSelectedEvent] = useState(null); // ← NOW FULL EVENT
//     const [currentView, setCurrentView] = useState("timeGridWeek");
//     const [currentRange, setCurrentRange] = useState({
//         start:
//             currentView === "timeGridWeek"
//                 ? moment().startOf("isoWeek").format("YYYY-MM-DD")
//                 : moment().startOf("month").format("YYYY-MM-DD"),
//         end:
//             currentView === "timeGridWeek"
//                 ? moment().endOf("isoWeek").format("YYYY-MM-DD")
//                 : moment().endOf("month").format("YYYY-MM-DD"),
//     });
//     const [searchTerm, setSearchTerm] = useState("");
//     const [departmentFilter, setDepartmentFilter] = useState("");
//     const [errors, setErrors] = useState({});

//     const [modalOpen, setModalOpen] = useState(false);
//     const [sidebarOpen, setSidebarOpen] = useState(false);
//     const [profileModalOpen, setProfileModalOpen] = useState(false);

//     const [form, setForm] = useState({
//         description: "",
//         startDate: "",
//         endDate: "",
//         timeStart: "",
//         timeEnd: "",
//         status: "AVAILABLE",
//         recurrence: undefined,
//     });

//     const [allUsers, setAllUsers] = useState([]);
//     const [selectedUsers, setSelectedUsers] = useState([]);
//     const [userCalendars, setUserCalendars] = useState({});
//     const socket = useRef(null);
//     const calendarRef = useRef(null);
//     const teammateCalendarRefs = useRef({});

//     const [editMode, setEditMode] = useState("this"); // "this" | "future" | "all" | "range"
//     const [deleteMode, setDeleteMode] = useState("this"); // same options
//     const [rangeStart, setRangeStart] = useState("");
//     const [rangeEnd, setRangeEnd] = useState("");

//     const filteredUsers = allUsers.filter((u) => {
//         const matchesSearch =
//             u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             u.email.toLowerCase().includes(searchTerm.toLowerCase());
//         const matchesDept = departmentFilter
//             ? u.department === departmentFilter
//             : true;
//         return matchesSearch && matchesDept;
//     });

//     useEffect(() => {
//         if (modalOpen && selectedEvent) {
//             const eventDate = moment(selectedEvent.start).format("YYYY-MM-DD");
//             setRangeStart(eventDate);
//             setRangeEnd(eventDate);
//             setEditMode("this");
//             setDeleteMode("this");
//         }
//     }, [modalOpen, selectedEvent]);

//     // SOCKET
//     useEffect(() => {
//         socket.current = io(SOCKET_URL, { withCredentials: true });
//         socket.current.on("availability-updated", () => {
//             getCurrentUserEvents();
//             selectedUsers.forEach((u) => getOtherUserEvents(u));
//         });
//         return () => socket.current?.disconnect();
//     }, [selectedUsers]);

//     // GET ALL USERS
//     useEffect(() => {
//         const getAllUsers = async () => {
//             try {
//                 setIsLoading("Loading teammates...");
//                 const res = await axiosInstance.get(apiUrls.getAllUsers);
//                 if (res?.data?.success) {
//                     setAllUsers(res.data.data.filter((u) => u.id !== user.id));
//                 }
//             } catch (err) {
//                 console.error(err);
//             } finally {
//                 setIsLoading("");
//             }
//         };
//         getAllUsers();
//     }, [user.id]);

//     // GET CURRENT USER EVENTS
//     const getCurrentUserEvents = async (loading = false) => {
//         try {
//             if (loading) setIsLoading("Loading your availability...");
//             const start = moment(currentRange.start).format("YYYY-MM-DD");
//             const end = moment(currentRange.end).format("YYYY-MM-DD");

//             const res = await axiosInstance.get(
//                 apiUrls.getCurrentUserAvailability(start, end)
//             );
//             console.log('res.data.data', res.data.data)

//             if (res?.data?.success) {
//                 const mapped = res.data.data.map((av) => ({
//                     ...av,
//                     title: av.title,
//                     extendedProps: {
//                         ...av.extendedProps,
//                         description: av.extendedProps.description || "",
//                         isRecurring: !!av.extendedProps.ruleId,
//                     },
//                 }));
//                 setEvents(mapped);
//             } else {
//                 setEvents([]);
//             }
//         } catch (err) {
//             console.error("Failed to load events:", err);
//         } finally {
//             setIsLoading("");
//         }
//     };

//     useEffect(() => {
//         getCurrentUserEvents(true);
//     }, [currentRange]);

//     // GET OTHER USER EVENTS
//     const getOtherUserEvents = async (user) => {
//         try {
//             setIsLoading(`Loading ${user.name}'s calendar...`);
//             const start = moment(currentRange.start).format("YYYY-MM-DD");
//             const end = moment(currentRange.end).format("YYYY-MM-DD");

//             const res = await axiosInstance.get(
//                 apiUrls.getOtherUserAvailability(user.id, start, end)
//             );
//             if (res?.data?.success) {
//                 setUserCalendars((prev) => ({ ...prev, [user.id]: res.data.data }));
//             }
//         } catch (err) {
//             console.error(err);
//         } finally {
//             setIsLoading("");
//         }
//     };

//     const toggleUserSelection = (u) => {
//         if (selectedUsers.some((s) => s.id === u.id)) {
//             setSelectedUsers((prev) => prev.filter((s) => s.id !== u.id));
//             setUserCalendars((prev) => {
//                 const updated = { ...prev };
//                 delete updated[u.id];
//                 return updated;
//             });
//             delete teammateCalendarRefs.current[u.id];
//         } else {
//             setSelectedUsers((prev) => [...prev, u]);
//             getOtherUserEvents(u);
//         }
//     };

//     const handleDateTimeSelect = (selectInfo) => {
//         const isMonthView = currentView === "dayGridMonth";

//         const startMoment = moment(selectInfo.start);
//         const endMoment = moment(selectInfo.end);

//         let startDate = startMoment.format("YYYY-MM-DD");
//         let endDate = isMonthView ? endMoment.subtract(1, "day").format("YYYY-MM-DD") : startDate; // Month view gives end exclusive

//         let timeStart, timeEnd;

//         if (isMonthView) {
//             // Auto-select nearest 30-min block
//             const now = moment();

//             // nearest next 30 min
//             const nextSlot = moment()
//                 .minute(Math.ceil(now.minute() / 30) * 30)
//                 .second(0);

//             timeStart = nextSlot.format("HH:mm");
//             timeEnd = nextSlot.clone().add(30, "minutes").format("HH:mm");
//         } else {
//             // Normal week/day view → user selected exact times
//             timeStart = startMoment.format("HH:mm");
//             timeEnd = endMoment.format("HH:mm");
//         }

//         setForm({
//             description: "",
//             startDate,
//             endDate,
//             timeStart,
//             timeEnd,
//             status: "AVAILABLE",
//             recurrence: undefined,
//         });

//         setSelectedEvent(null);
//         setModalOpen(true);
//     };

//     console.log('events', events)

//     // CLICK EVENT → EDIT (THIS IS THE FIX!)
//     const handleEventClick = (clickInfo) => {
//         const event = clickInfo.event;
//         const props = event.extendedProps;
//         console.log('clickInfo.event', clickInfo.event)

//         setForm({
//             description: props.description || "",
//             startDate: moment(event.start).format("YYYY-MM-DD"),
//             endDate: moment(event.end).format("YYYY-MM-DD"),
//             timeStart: moment(event.start).format("HH:mm"),
//             timeEnd: moment(event.end).format("HH:mm"),
//             status: event.title,
//             recurrence: undefined, // We don't edit recurrence rule yet (advanced)
//         });

//         // THIS IS CRITICAL — store FULL event
//         setSelectedEvent({
//             id: event.id,
//             ruleId: props.ruleId || null,
//             isRecurring: !!props.ruleId,
//             start: event.start,
//             end: event.end,
//             title: event.title,
//             extendedProps: props,
//         });

//         setModalOpen(true);
//     };

//     // SUBMIT (CREATE/UPDATE)
//     const handleSubmit = async () => {
//         try {
//             if (!form.startDate || !form.timeStart || !form.timeEnd) {
//                 setErrors({ time: "Date and time are required" });
//                 await Swal.fire({
//                     icon: "error",
//                     title: "Missing Fields",
//                     text: "Date and time are required"
//                 });
//                 return;
//             }
//             if (form.timeStart >= form.timeEnd) {
//                 setErrors({ time: "End time must be after start time" });
//                 await Swal.fire({
//                     icon: "error",
//                     title: "Invalid Time",
//                     text: "End time must be after start time"
//                 });
//                 return;
//             }

//             const basePayload = {
//                 startDate: form.startDate,
//                 endDate: form.endDate || undefined,
//                 timeStart: form.timeStart,
//                 timeEnd: form.timeEnd,
//                 status: form.status,
//                 description: form.description?.trim() || null,
//                 recurrence:
//                     form.recurrence?.freq && form.recurrence.freq !== "NONE"
//                         ? { ...form.recurrence }
//                         : undefined,
//             };

//             // Add conditional fields based on edit mode
//             if (editMode === "future") {
//                 basePayload.applyFromDate = moment(selectedEvent.start).format("YYYY-MM-DD");
//             } else if (editMode === "range") {
//                 if (!rangeStart || !rangeEnd) {
//                     await Swal.fire({
//                         icon: "error",
//                         title: "Range Required",
//                         text: "Please select range start and end dates"
//                     });
//                     return;
//                 }
//                 basePayload.applyToRange = {
//                     start: rangeStart,
//                     end: rangeEnd,
//                 };
//             }

//             setIsLoading("Saving...");

//             if (selectedEvent) {
//                 // === UPDATE LOGIC ===
//                 const instanceId = selectedEvent.extendedProps.instanceId;

//                 let url = apiUrls.updateOneAvailability(instanceId);

//                 // Only use /all route if updating entire series AND it's recurring
//                 if (editMode === "all" && selectedEvent.extendedProps.isRecurring) {
//                     url = apiUrls.updateAllAvailability(instanceId);
//                 }

//                 await axiosInstance.put(url, basePayload);
//             } else {
//                 // === CREATE LOGIC ===
//                 await axiosInstance.post(apiUrls.createAvailability, basePayload);
//             }

//             socket.current?.emit("availability-updated");
//             setModalOpen(false);
//             getCurrentUserEvents(true);
//             selectedUsers.forEach((u) => getOtherUserEvents(u));

//             // Success popup
//             await Swal.fire({
//                 icon: "success",
//                 title: selectedEvent ? "Availability Updated Successfully." : "Availability created Successfully.",
//                 timer: 1500,
//                 showConfirmButton: false
//             });
//         } catch (err) {
//             await Swal.fire({
//                 icon: "error",
//                 title: "Save Failed",
//                 text: err.response?.data?.message || err.message
//             });
//         } finally {
//             setIsLoading("");
//         }
//     };

//     // DELETE
//     const handleDelete = async () => {
//         if (!selectedEvent) return;

//         const instanceId = selectedEvent.extendedProps.instanceId;
//         const isRecurring = selectedEvent.extendedProps.isRecurring;

//         let url = apiUrls.deleteOneAvailability(instanceId);
//         let payload = {};

//         // Ask for delete confirmation (for non-recurring events)
//         if (!isRecurring && deleteMode !== "range") {
//             const confirm = await Swal.fire({
//                 title: "Are you sure?",
//                 text: "You want to delete this availability.",
//                 icon: "warning",
//                 showCancelButton: true,
//                 confirmButtonText: "Yes, delete",
//             });

//             if (!confirm.isConfirmed) return;
//         }

//         // Check recurring delete modes
//         if (deleteMode === "all" && isRecurring) {
//             url = apiUrls.deleteAllAvailability(instanceId);
//         } else if (deleteMode === "future" && isRecurring) {
//             payload.applyFromDate = moment(selectedEvent.start).format("YYYY-MM-DD");
//         } else if (deleteMode === "range" && isRecurring) {
//             if (!rangeStart || !rangeEnd) {
//                 await Swal.fire({
//                     icon: "error",
//                     title: "Range Required",
//                     text: "Please select range for deletion"
//                 });
//                 return;
//             }
//             payload.applyToRange = { start: rangeStart, end: rangeEnd };
//         }

//         try {
//             setIsLoading("Deleting...");

//             await axiosInstance.delete(url, { data: payload });

//             socket.current?.emit("availability-updated");
//             setModalOpen(false);
//             getCurrentUserEvents(true);
//             selectedUsers.forEach((u) => getOtherUserEvents(u));

//             await Swal.fire({
//                 icon: "success",
//                 title: "Deleted",
//                 text: "Availability removed successfully",
//                 timer: 1500,
//                 showConfirmButton: false,
//             });

//         } catch (err) {
//             await Swal.fire({
//                 icon: "error",
//                 title: "Delete failed",
//                 text: err.response?.data?.message || err.message,
//             });
//         } finally {
//             setIsLoading("");
//         }
//     };

//     // LOGOUT & PROFILE
//     const handleLogout = async () => {
//         try {
//             setIsLoading("Logging out...");
//             await axiosInstance.post(apiUrls.logoutUser);
//             setUser(null);
//         } catch (err) {
//             console.error(err);
//         } finally {
//             setIsLoading("");
//         }
//     };

//     const UpdateUserProfile = async (userForm) => {
//         try {
//             setIsLoading("Updating profile...");
//             const res = await axiosInstance.put(apiUrls.updateUser, userForm);
//             if (res?.data?.success) {
//                 setUser(res.data.data);
//                 setProfileModalOpen(false);
//             }
//         } catch (err) {
//             console.error(err);
//         } finally {
//             setIsLoading("");
//         }
//     };

//     return (
//         <>
//             {isLoading && <Loader message={isLoading} />}
//             <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-blue-100 to-indigo-200">
//                 <MobileHeader
//                     title="Team Calendar"
//                     sidebarOpen={sidebarOpen}
//                     setSidebarOpen={setSidebarOpen}
//                 />
//                 <Sidebar
//                     sidebarOpen={sidebarOpen}
//                     setSidebarOpen={setSidebarOpen}
//                     user={user}
//                     searchTerm={searchTerm}
//                     setSearchTerm={setSearchTerm}
//                     departmentFilter={departmentFilter}
//                     setDepartmentFilter={setDepartmentFilter}
//                     allUsers={allUsers}
//                     filteredUsers={filteredUsers}
//                     selectedUsers={selectedUsers}
//                     toggleUserSelection={toggleUserSelection}
//                     setProfileModalOpen={setProfileModalOpen}
//                     handleLogout={handleLogout}
//                 />

//                 <main className="flex-1 overflow-auto p-4 lg:p-6">
//                     <div className="max-w-full mx-auto">
//                         <div className="mb-6 hidden md:block">
//                             <h1 className="text-3xl font-bold text-gray-800">
//                                 Team Calendar
//                             </h1>
//                             <p className="text-gray-600">
//                                 Manage availability and view team schedules
//                             </p>
//                         </div>

//                         <div
//                             className={`grid gap-6 ${selectedUsers.length > 0 ? "lg:grid-cols-2" : "lg:grid-cols-1"
//                                 }`}
//                         >
//                             <OwnCalendar
//                                 user={user}
//                                 calendarRef={calendarRef}
//                                 currentView={currentView}
//                                 setCurrentView={setCurrentView}
//                                 events={events}
//                                 handleDateSelect={handleDateTimeSelect}
//                                 handleEventClick={handleEventClick}
//                                 setCurrentRange={setCurrentRange}
//                             />

//                             {selectedUsers.map((u) => (
//                                 <TeammateCalendar
//                                     key={u.id}
//                                     user={u}
//                                     calendarRef={(el) =>
//                                         (teammateCalendarRefs.current[u.id] = el)
//                                     }
//                                     events={userCalendars[u.id] || []}
//                                     currentView={currentView}
//                                     calendarRefAPI={teammateCalendarRefs.current[u.id]?.getApi()}
//                                     onViewChange={(view) => setCurrentView(view)}
//                                     removeCalendar={() => toggleUserSelection(u)}
//                                 />
//                             ))}
//                         </div>
//                     </div>
//                 </main>

//                 <AvailabilityModal
//                     modalOpen={modalOpen}
//                     setModalOpen={setModalOpen}
//                     selectedEvent={selectedEvent}
//                     form={form}
//                     setForm={setForm}
//                     editMode={editMode}
//                     deleteMode={deleteMode}
//                     setDeleteMode={setDeleteMode}
//                     setEditMode={setEditMode}
//                     rangeStart={rangeStart}
//                     rangeEnd={rangeEnd}
//                     setRangeStart={setRangeStart}
//                     setRangeEnd={setRangeEnd}
//                     errors={errors}
//                     setErrors={setErrors}
//                     handleSubmit={handleSubmit}
//                     handleDelete={handleDelete}
//                     isRecurring={!!selectedEvent?.ruleId}
//                 />

//                 <ProfileModal
//                     profileModalOpen={profileModalOpen}
//                     setProfileModalOpen={setProfileModalOpen}
//                     editForm={{
//                         name: user?.name || "",
//                         department: user?.department || "",
//                     }}
//                     setEditForm={() => { }}
//                     UpdateCurrentUser={UpdateUserProfile}
//                 />
//             </div>
//         </>
//     );
// }
