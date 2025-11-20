import moment from "moment";
import { useEffect } from "react";
import DatePicker from "react-datepicker";
import {
  Calendar,
  Plus,
  X,
  Repeat,
  Trash2,
  Save,
  AlertCircle,
} from "lucide-react";

const AvailabilityModal = ({
  modalOpen,
  setModalOpen,
  selectedEvent,
  editMode,
  setEditMode,
  rangeStart,
  setRangeStart,
  rangeEnd,
  setRangeEnd,
  deleteMode,
  setDeleteMode,
  form,
  setForm,
  errors,
  setErrors,
  handleSubmit,
  handleDelete,
  isRecurring = false,
}) => {
  if (!modalOpen) return null;

  const isEdit = !!selectedEvent;

  // 12 HOUR TIME SLOTS FOR SELECT INPUTS
  const timeSlots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = moment().hour(h).minute(m);
      timeSlots.push({
        value: time.format("HH:mm"), // → backend: "13:30"
        label: time.format("h:mm A"), // → UI: "1:30 PM"
      });
    }
  }

  const minDate = moment().startOf("day").toDate();

  // VALIDATIONS
  useEffect(() => {
    const newErrors = {};

    if (form?.startDate && form?.endDate && form?.startDate > form?.endDate) {
      newErrors.date = "End date must be same or after start date";
    }

    if (form?.timeStart && form?.timeEnd && form?.timeStart >= form?.timeEnd) {
      newErrors.time = "End time must be after start time";
    }

    setErrors(newErrors);
  }, [
    form?.startDate,
    form?.endDate,
    form?.timeStart,
    form?.timeEnd,
    setErrors,
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mt-10">
        {/* HEADER  */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-5 rounded-t-3xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            {isEdit ? (
              <Calendar className="w-7 h-7 text-white" />
            ) : (
              <Plus className="w-7 h-7 text-white" />
            )}
            <h2 className="text-2xl font-bold text-white">
              {isEdit ? "Edit Availability" : "New Availability"}
            </h2>
          </div>
          <button
            onClick={() => setModalOpen(false)}
            className="p-2 hover:bg-white/20 rounded-xl"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* RECURRING NOTICE  */}
          {isRecurring && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-center gap-3 text-amber-800">
              <Repeat className="w-6 h-6" />
              <span className="font-bold">
                This is part of a recurring series
              </span>
            </div>
          )}

          {selectedEvent?.extendedProps?.isRecurring && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Edit recurrence:
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="editMode"
                    value="this"
                    checked={editMode === "this"}
                    onChange={(e) => setEditMode(e.target.value)}
                    className="mr-2"
                  />
                  <span>This occurrence only</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="editMode"
                    value="future"
                    checked={editMode === "future"}
                    onChange={(e) => setEditMode(e.target.value)}
                    className="mr-2"
                  />
                  <span>This and all following</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="editMode"
                    value="all"
                    checked={editMode === "all"}
                    onChange={(e) => setEditMode(e.target.value)}
                    className="mr-2"
                  />
                  <span>Entire series</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="editMode"
                    value="range"
                    checked={editMode === "range"}
                    onChange={(e) => setEditMode(e.target.value)}
                    className="mr-2"
                  />
                  <span>Custom range</span>
                </label>

                {editMode === "range" && (
                  <div className="mt-3 ml-6 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600">
                        From
                      </label>
                      <input
                        type="date"
                        value={rangeStart}
                        onChange={(e) => setRangeStart(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">To</label>
                      <input
                        type="date"
                        value={rangeEnd}
                        min={rangeStart}
                        onChange={(e) => setRangeEnd(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delete Scope Selector */}
          {selectedEvent?.extendedProps?.isRecurring && (
            <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <label className="block text-sm font-medium text-red-800 mb-2">
                Delete options:
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="deleteMode"
                    value="this"
                    checked={deleteMode === "this"}
                    onChange={(e) => setDeleteMode(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">This occurrence only</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="deleteMode"
                    value="future"
                    checked={deleteMode === "future"}
                    onChange={(e) => setDeleteMode(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">This and following</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="deleteMode"
                    value="all"
                    checked={deleteMode === "all"}
                    onChange={(e) => setDeleteMode(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Entire series</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="deleteMode"
                    value="range"
                    checked={deleteMode === "range"}
                    onChange={(e) => setDeleteMode(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Custom range</span>
                </label>
                {deleteMode === "range" && (
                  <div className="mt-3 ml-6 grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    />
                    <input
                      type="date"
                      value={rangeEnd}
                      min={rangeStart}
                      onChange={(e) => setRangeEnd(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={form?.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="e.g., Team standup"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none"
            />
          </div>
          {errors?.description && (
            <p className="text-red-600 text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {errors?.description}
            </p>
          )}

          {/* DATE SELECTION  */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date
              </label>
              <DatePicker
                selected={
                  form?.startDate ? moment(form?.startDate).toDate() : null
                }
                onChange={(date) =>
                  setForm({
                    ...form,
                    startDate: moment(date).format("YYYY-MM-DD"),
                  })
                }
                minDate={minDate}
                dateFormat="MMM dd, yyyy"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none cursor-pointer"
                placeholderText="Select date"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date
              </label>
              <DatePicker
                selected={form?.endDate ? moment(form?.endDate).toDate() : null}
                onChange={(date) =>
                  setForm({
                    ...form,
                    endDate: date ? moment(date).format("YYYY-MM-DD") : "",
                  })
                }
                minDate={
                  form?.startDate ? moment(form?.startDate).toDate() : minDate
                }
                dateFormat="MMM dd, yyyy"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none cursor-pointer"
                placeholderText="Same day"
              />
            </div>
          </div>
          {errors?.date && (
            <p className="text-red-600 text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {errors?.date}
            </p>
          )}

          {form.status !== "LEAVE" && (
            <>
              {/* TIME SELECTION  */}
              <div className="grid grid-cols-2 gap-4">
                {/* Start Time */}
                <div>
                  <label
                    name="startTime"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Start Time
                  </label>
                  <select
                    value={form?.timeStart || ""}
                    onChange={(e) =>
                      setForm({ ...form, timeStart: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none"
                  >
                    <option value="">Select start time</option>
                    {timeSlots.map(({ value, label }) => {
                      // const isPast =
                      //     form.startDate &&
                      //     moment(form.startDate).isSame(moment(), "day") &&
                      //     moment(value, "HH:mm").isBefore(moment());
                      return (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* END TIME  */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Time
                  </label>
                  <select
                    value={form?.timeEnd || ""}
                    onChange={(e) =>
                      setForm({ ...form, timeEnd: e.target.value })
                    }
                    disabled={!form?.timeStart}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none disabled:bg-gray-100"
                  >
                    <option value="">
                      {form?.timeStart
                        ? "Select end time"
                        : "First select start time"}
                    </option>
                    {timeSlots
                      .filter(({ value }) => {
                        if (!form?.timeStart) return false;
                        return moment(value, "HH:mm").isAfter(
                          moment(form?.timeStart, "HH:mm")
                        );
                      })
                      .map(({ value, label }) => (
                        <option key={value * 3} value={value}>
                          {label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </>
          )}
          {errors?.time && (
            <p className="text-red-600 text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {errors?.time}
            </p>
          )}

          {/* MAKE LEAVE  */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form?.status === "LEAVE" ? true : false}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.checked ? "LEAVE" : "AVAILABLE",
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Make Leave</span>
            </label>
          </div>

          {form.status !== "LEAVE" && (
            <>
              {/* STATUS  */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={form?.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none"
                >
                  <option value="AVAILABLE">Available (Green)</option>
                  <option value="BUSY">Busy (Red)</option>
                  <option value="TENTATIVE">Tentative (Yellow)</option>
                </select>
              </div>

              {/* RECURRENCE */}
              <div className="border-t-2 border-gray-100 pt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Recurrence
                </label>
                <select
                  value={form?.recurrence?.freq || "NONE"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "NONE") {
                      setForm({ ...form, recurrence: undefined });
                    } else {
                      setForm({
                        ...form,
                        recurrence: {
                          freq: val,
                          interval: 1,
                          byDay: [],
                          until: "",
                        },
                      });
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none"
                >
                  <option value="NONE">No recurrence</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>

                {/* RECURRENCE OPTIONS */}
                {form.recurrence && form.recurrence.freq !== "NONE" && (
                  <div className="mt-5 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Repeat every
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={form?.recurrence?.interval}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              recurrence: {
                                ...form?.recurrence,
                                interval: Number(e.target.value) || 1,
                              },
                            })
                          }
                          className="w-full mt-1 px-3 py-2 border border-indigo-300 rounded-lg focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Ends on
                        </label>
                        <DatePicker
                          selected={
                            form?.recurrence?.until
                              ? moment(form?.recurrence?.until).toDate()
                              : null
                          }
                          onChange={(date) =>
                            setForm({
                              ...form,
                              recurrence: {
                                ...form?.recurrence,
                                until: date
                                  ? moment(date).format("YYYY-MM-DD")
                                  : "",
                              },
                            })
                          }
                          minDate={moment(form?.startDate)
                            .add(1, "day")
                            .toDate()}
                          className="w-full mt-1 px-3 py-2 border border-indigo-300 rounded-lg focus:border-indigo-500 outline-none"
                          placeholderText="No end date"
                        />
                      </div>
                    </div>

                    {/* WEEKLY OPTIONS */}
                    {form?.recurrence?.freq === "WEEKLY" && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-3">
                          Repeat on
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map(
                            (day) => (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  const byDay =
                                    form?.recurrence?.byDay.includes(day)
                                      ? form?.recurrence?.byDay?.filter(
                                          (d) => d !== day
                                        )
                                      : [...form?.recurrence?.byDay, day];
                                  setForm({
                                    ...form,
                                    recurrence: { ...form?.recurrence, byDay },
                                  });
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition ${
                                  form?.recurrence?.byDay.includes(day)
                                    ? "bg-indigo-600 text-white shadow-lg"
                                    : "bg-white border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                                }`}
                              >
                                {day}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* BUTTONS  */}
          <div className="flex justify-end gap-4 pt-8 border-t">
            {isEdit && (
              <button
                onClick={handleDelete}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold flex items-center gap-2 shadow-lg"
              >
                <Trash2 className="w-5 h-5" /> Delete
              </button>
            )}
            <button
              onClick={() => setModalOpen(false)}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                Object.keys(errors).length > 0 ||
                !form?.startDate ||
                !form?.timeStart ||
                !form?.timeEnd
              }
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl hover:from-indigo-700 hover:to-purple-800 font-bold shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isEdit ? "Update" : "Create"} Availability
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityModal;
