// CalendarToolbar.jsx
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, CalendarRangeIcon } from "lucide-react";

const CalendarToolbar = ({ calendarApi }) => {
    if (!calendarApi) return null;

    const views = [
        { id: "dayGridMonth", label: "Month", icon: <Calendar className="w-4 h-4" /> },
        { id: "timeGridWeek", label: "Week", icon: <CalendarRangeIcon className="w-4 h-4" /> },
        { id: "timeGridDay", label: "Day", icon: <CalendarDays className="w-4 h-4" /> },
    ];

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2 bg-white border-b border-gray-200">
            {/* NAVIGATION BUTTONS  */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => calendarApi.prev()}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Previous"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                <h3 className="font-semibold text-gray-800 min-w-[120px] text-center sm:text-left text-xs md:text-base">
                    {calendarApi.view.title}
                </h3>

                <button
                    onClick={() => calendarApi.next()}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Next"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>

                <button
                    onClick={() => calendarApi.today()}
                    className="ml-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                >
                    Today
                </button>
            </div>

            {/* VIEW BUTTONS  */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {views.map((v) => (
                    <button
                        key={v.id}
                        onClick={() => calendarApi.changeView(v.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer
                            ${calendarApi.view.type === v.id
                                ? "bg-white text-blue-700 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        {v.icon}
                        <span className="hidden sm:inline">{v.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CalendarToolbar;
