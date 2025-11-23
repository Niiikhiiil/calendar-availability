import moment from "moment";
import Swal from "sweetalert2";
import { useOutletContext } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import { apiUrls } from "../utils/apiUrl";
import Loader from "../components/ui/Loader";
import axiosInstance, { base } from "../axios/axiosInstance";
import OwnCalendar from "../components/calendars/OwnCalendar";
import AvailabilityModal from "../components/ui/AvailabilityModal";
import { io } from "socket.io-client";

const SOCKET_URL = base;

export default function MyCalendar() {
  const { user } = useOutletContext();
  const [isLoading, setIsLoading] = useState("");
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const calendarRef = useRef(null);
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
  const socket = useRef(null);
  const [form, setForm] = useState({
    description: "",
    startDate: "",
    endDate: "",
    timeStart: "",
    timeEnd: "",
    status: "AVAILABLE",
    recurrence: undefined,
  });
  const [editMode, setEditMode] = useState("this");
  const [deleteMode, setDeleteMode] = useState("this");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getCurrentUserEvents(true);
  }, [currentRange]);

  useEffect(() => {
    socket.current = io(SOCKET_URL, { withCredentials: true });
    socket.current.on("availability-updated", () => {
      getCurrentUserEvents(true);
    });
    return () => socket.current?.disconnect();
  }, []);

  const getCurrentUserEvents = async (loading = false) => {
    const api = calendarRef.current?.getApi();
    const view = api.view;
    try {
      if (loading) setIsLoading("Loading your availability...");
      const start = moment(view.currentStart).format("YYYY-MM-DD");
      const end = moment(view.currentEnd)
        .subtract(1, "day")
        .format("YYYY-MM-DD");

      const res = await axiosInstance.get(
        apiUrls.getCurrentUserAvailability(start, end)
      );

      if (res?.data?.success) {
        const mapped = res.data.data.map((av) => ({
          ...av,
          title: av.title,
          extendedProps: {
            ...av.extendedProps,
            description: av.extendedProps.description || "",
            isRecurring: !!av.extendedProps.ruleId,
          },
        }));
        setEvents(mapped);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setIsLoading("");
    }
  };

  const handleDateTimeSelect = (selectInfo) => {
    const isMonthView = currentView === "dayGridMonth";

    const startMoment = moment(selectInfo.start);
    const endMoment = moment(selectInfo.end);

    let startDate = startMoment.format("YYYY-MM-DD");
    let endDate = isMonthView
      ? endMoment.subtract(1, "day").format("YYYY-MM-DD")
      : startDate; // Month view gives end exclusive

    let timeStart, timeEnd;

    if (isMonthView) {
      //  MONTH VIEW DEFAULT TIMES
      const now = moment();

      // NEAREST HALF HOUR SLOT
      const nextSlot = moment()
        .minute(Math.ceil(now.minute() / 30) * 30)
        .second(0);

      timeStart = nextSlot.format("HH:mm");
      timeEnd = nextSlot.clone().add(30, "minutes").format("HH:mm");
    } else {
      // NORMAL VIEW TIMES
      timeStart = startMoment.format("HH:mm");
      timeEnd = endMoment.format("HH:mm");
    }

    setForm({
      description: "",
      startDate,
      endDate,
      timeStart,
      timeEnd,
      status: "AVAILABLE",
      recurrence: undefined,
    });

    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    const props = event.extendedProps;
    setForm({
      description: props.description || "",
      startDate: moment(event.start).format("YYYY-MM-DD"),
      endDate: moment(event.end).format("YYYY-MM-DD"),
      timeStart: moment(event.start).format("HH:mm"),
      timeEnd: moment(event.end).format("HH:mm"),
      status: event.title,
      recurrence: props?.recurrence || undefined,
    });

    setSelectedEvent({
      id: event.id,
      ruleId: props.ruleId || null,
      isRecurring: !!props.ruleId,
      start: event.start,
      end: event.end,
      title: event.title,
      extendedProps: props,
    });

    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!form.description || form.description.trim() === "") {
        setErrors({ description: "Description is required" });
        await Swal.fire({
          icon: "error",
          title: "Missing Fields",
          text: "Description is required",
        });
        return;
      }
      if (!form.startDate || !form.timeStart || !form.timeEnd) {
        setErrors({ time: "Date and time are required" });
        await Swal.fire({
          icon: "error",
          title: "Missing Fields",
          text: "Date and time are required",
        });
        return;
      }
      if (form.timeStart >= form.timeEnd) {
        setErrors({ time: "End time must be after start time" });
        await Swal.fire({
          icon: "error",
          title: "Invalid Time",
          text: "End time must be after start time",
        });
        return;
      }

      const basePayload = {
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        timeStart: form.status === "LEAVE" ? "00:00" : form.timeStart,
        timeEnd: form.status === "LEAVE" ? "23:59" : form.timeEnd,
        status: form.status,
        description: form.description?.trim() || null,
        recurrence:
          form.recurrence?.freq &&
          form.recurrence.freq !== "NONE" &&
          form.status !== "LEAVE" &&
          ((selectedEvent?.ruleId && editMode === "pattern") ||
            !selectedEvent ||
            (selectedEvent?.id && !selectedEvent?.ruleId))
            ? { ...form.recurrence }
            : undefined,
      };

      // HANDLE RECURRING EDIT MODES
      if (editMode === "future") {
        basePayload.applyFromDate = moment(selectedEvent.start).format(
          "YYYY-MM-DD"
        );
      } else if (editMode === "range") {
        if (!rangeStart || !rangeEnd) {
          await Swal.fire({
            icon: "error",
            title: "Range Required",
            text: "Please select range start and end dates",
          });
          return;
        }
        basePayload.applyToRange = {
          start: rangeStart,
          end: rangeEnd,
        };
      }

      setIsLoading("Saving...");

      if (selectedEvent) {
        const instanceId = selectedEvent.extendedProps.instanceId;

        let url = apiUrls.updateOneAvailability(instanceId);

        // ONLY FOR ALL EDIT MODE
        if (
          (editMode === "all" || editMode === "pattern") &&
          selectedEvent.extendedProps.isRecurring
        ) {
          url = apiUrls.updateAllAvailability(instanceId);
        }

        await axiosInstance.put(url, basePayload);
      } else {
        await axiosInstance.post(apiUrls.createAvailability, basePayload);
      }

      socket.current?.emit("availability-updated");
      setModalOpen(false);
      getCurrentUserEvents(true);
      setEditMode("this");
      setDeleteMode("this");
      setRangeStart("");
      setRangeEnd("");

      // SUCCESS ALERT
      await Swal.fire({
        icon: "success",
        title: selectedEvent
          ? "Availability Updated Successfully."
          : "Availability created Successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: err.response?.data?.message || err.message,
      });
    } finally {
      setIsLoading("");
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;

    const instanceId = selectedEvent.extendedProps.instanceId;
    const isRecurring = selectedEvent.extendedProps.isRecurring;

    let url = apiUrls.deleteOneAvailability(instanceId);
    let payload = {};

    // ASK FOR CONFIRMATION IF NOT RECURRING OR DELETING SINGLE INSTANCE
    if (!isRecurring && deleteMode !== "range") {
      const confirm = await Swal.fire({
        title: "Are you sure?",
        text: "You want to delete this availability.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete",
      });

      if (!confirm.isConfirmed) return;
    }

    // HANDLE RECURRING DELETE MODES
    if (deleteMode === "all" && isRecurring) {
      url = apiUrls.deleteAllAvailability(instanceId);
    } else if (deleteMode === "future" && isRecurring) {
      payload.applyFromDate = moment(selectedEvent.start).format("YYYY-MM-DD");
    } else if (deleteMode === "range" && isRecurring) {
      if (!rangeStart || !rangeEnd) {
        await Swal.fire({
          icon: "error",
          title: "Range Required",
          text: "Please select range for deletion",
        });
        return;
      }
      payload.applyToRange = { start: rangeStart, end: rangeEnd };
    }

    try {
      setIsLoading("Deleting...");

      await axiosInstance.delete(url, { data: payload });

      socket.current?.emit("availability-updated");
      setModalOpen(false);
      getCurrentUserEvents(true);

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Availability removed successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: err.response?.data?.message || err.message,
      });
    } finally {
      setIsLoading("");
      setDeleteMode("this");
      setEditMode("this");
    }
  };

  return (
    <>
      {isLoading && <Loader message={isLoading} />}
      <div className="p-4 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Calendar</h1>
        <p className="text-gray-600 mb-6">Manage your availability</p>

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

        <AvailabilityModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          selectedEvent={selectedEvent}
          form={form}
          setForm={setForm}
          editMode={editMode}
          deleteMode={deleteMode}
          setDeleteMode={setDeleteMode}
          setEditMode={setEditMode}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          setRangeStart={setRangeStart}
          setRangeEnd={setRangeEnd}
          errors={errors}
          setErrors={setErrors}
          handleSubmit={handleSubmit}
          handleDelete={handleDelete}
          isRecurring={!!selectedEvent?.ruleId}
        />
      </div>
    </>
  );
}
