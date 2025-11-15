import moment from "moment";
import { Calendar, Plus, X, Repeat, Trash2, Save } from "lucide-react";

const AvailabilityModal = ({
    modalOpen,
    setModalOpen,
    selectedEvent,
    form,
    setForm,
    errors,
    handleSubmit,
    handleDelete
}) => {
    if (!modalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-start p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mt-8 sm:mt-20 animate-fadeIn">

                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                        {selectedEvent ? (
                            <Calendar className="w-6 h-6 text-white" />
                        ) : (
                            <Plus className="w-6 h-6 text-white" />
                        )}
                        <h2 className="text-xl font-bold text-white">
                            {selectedEvent ? "Edit Availability" : "New Availability"}
                        </h2>
                    </div>

                    <button
                        onClick={() => setModalOpen(false)}
                        className="p-1 hover:bg-white/20 rounded-lg transition"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">

                    {selectedEvent && (form?.recurrence !== "NONE" || !form?.recurrence) && (
                        <div>
                            <span className="text-sm text-amber-950">
                                <Repeat className="w-5 h-5 inline-block mr-2 pb-1" />
                                This is a recurring event!
                            </span>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <input
                            type="text"
                            placeholder="Enter description..."
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {errors.description && (
                            <p className="text-red-600 text-xs mt-1">{errors?.description}</p>
                        )}
                    </div>

                    {/* Start / End Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Time
                            </label>
                            <input
                                type="datetime-local"
                                value={form.start.slice(0, 16)}
                                onChange={(e) => setForm({ ...form, start: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                            {errors.start && (
                                <p className="text-red-600 text-xs mt-1">{errors?.start}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Time
                            </label>
                            <input
                                type="datetime-local"
                                value={form.end.slice(0, 16)}
                                onChange={(e) => setForm({ ...form, end: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                            {errors.end && (
                                <p className="text-red-600 text-xs mt-1">{errors.end}</p>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="AVAILABLE">Available</option>
                            <option value="BUSY">Busy</option>
                            <option value="TENTATIVE">Tentative</option>
                        </select>
                    </div>

                    {/* Recurrence */}
                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Recurrence
                            </label>
                            <select
                                value={form.recurrence}
                                onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="NONE">None</option>
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                                <option value="MONTHLY">Monthly</option>
                            </select>
                        </div>

                        {form.recurrence !== "NONE" && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Repeat Every
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={form.interval}
                                            onChange={(e) => setForm({
                                                ...form,
                                                interval: parseInt(e.target.value) || 1
                                            })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ends On
                                        </label>
                                        <input
                                            type="date"
                                            value={form.until}
                                            onChange={(e) => setForm({ ...form, until: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        {errors?.until && (
                                            <p className="text-red-600 text-xs mt-1">{errors?.until}</p>
                                        )}
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500">
                                    {form.recurrence === "DAILY" && `Repeats every ${form.interval} day(s)`}
                                    {form.recurrence === "WEEKLY" && `Repeats every ${form.interval} week(s)`}
                                    {form.recurrence === "MONTHLY" && `Repeats every ${form.interval} month(s)`}
                                    {form.until && ` until ${moment(form.until).format("MMM D, YYYY")}`}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        {selectedEvent && (
                            <button
                                onClick={handleDelete}
                                className="flex items-center justify-center gap-2 px-5 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        )}

                        <div className="flex gap-3 ml-auto w-full sm:w-auto">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="flex-1 sm:flex-none px-5 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSubmit}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                            >
                                <Save className="w-4 h-4" />
                                Save
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AvailabilityModal;
