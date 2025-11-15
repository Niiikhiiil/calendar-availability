import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import moment from "moment";
import { Calendar, Repeat } from "lucide-react";
import { Tooltip as ReactTooltip } from 'react-tooltip';
import CalendarToolbar from "./CalenderToolbar";

const OwnCalendar = ({
    user,
    calendarRef,
    currentView,
    setCurrentView,
    events,
    handleDateSelect,
    handleEventClick,
    setCurrentRange,
}) => {

    return (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">

            {/* HEADER  */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-white" />
                    <h3 className="font-semibold text-white">
                        My Calendar (<span className="italic font-extrabold">{user.name}</span>)
                    </h3>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce" />
            </div>

            {/* TOOLBAR  */}
            <CalendarToolbar
                calendarApi={calendarRef.current?.getApi()}
                key={"currentUser"}
            />

            {/* CALENDAR  */}
            <div className="p-3 sm:p-4 h-full max-h-[calc(100vh-250px)] overflow-auto">
                <div className="min-w-[900px] overflow-x-auto h-full">
                    <FullCalendar
                        nowIndicator
                        ref={calendarRef}
                        currentView={currentView}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        initialDate={moment()._d}
                        selectable
                        select={handleDateSelect}
                        eventClick={handleEventClick}
                        events={events}
                        height="auto"
                        titleFormat={{ year: "numeric", month: "long", day: "numeric" }}
                        headerToolbar={false}
                        buttonIcons={false}
                        dayHeaderContent={(args) => (
                            <div style={{ cursor: "pointer" }}>
                                <h4 className="text-sm text-slate-700">
                                    {moment(args.date).format("DD-MMM")}
                                </h4>
                                <span className="text-xs text-slate-500">
                                    {moment(args.date).format("dddd")}
                                </span>
                            </div>
                        )}
                        firstDay={1}
                        weekends
                        allDayText="All day"
                        eventContent={(info) => {
                            const { title, start, end, extendedProps } = info.event;
                            const tooltipId = `event-tooltip-${info.event._def.publicId}`;

                            return (
                                <>
                                    <div
                                        data-tooltip-id={tooltipId}
                                        className="p-1 text-xs"
                                    >
                                        <div className="flex items-center justify-between">
                                            {moment(start).format("HH:mm")} - {moment(end).format("HH:mm")}
                                            <strong>{title}</strong>
                                            {extendedProps.recurringRule && (
                                                <Repeat className="w-3 h-3 text-white ml-1" />
                                            )}
                                        </div>
                                    </div>

                                    <ReactTooltip
                                        id={tooltipId}
                                        place="top"
                                        effect="solid"
                                        className="!p-3 !rounded-xl !shadow-xl !bg-white/90 !backdrop-blur-sm !text-gray-800 !max-w-xs border border-gray-200"
                                    >
                                        <div className="space-y-1 text-left">
                                            <div className="font-semibold text-gray-900 text-sm">
                                                {title}
                                            </div>

                                            <div className="text-xs text-gray-600">
                                                {moment(start).format("HH:mm")} – {moment(end).format("HH:mm")}
                                            </div>

                                            {extendedProps.description && (
                                                <div className="text-xs text-gray-700 italic">
                                                    {extendedProps.description}
                                                </div>
                                            )}

                                            {extendedProps.recurringRule && (
                                                <div className="flex items-center gap-1 text-blue-600 text-xs font-medium mt-1">
                                                    <Repeat className="w-3 h-3" />
                                                    <span>Recurring event</span>
                                                </div>
                                            )}
                                        </div>
                                    </ReactTooltip>
                                </>
                            );
                        }}
                        datesSet={(info) => {
                            const startOfView = moment(info.start).format("YYYY-MM-DD");
                            const endOfView = moment(info.end)
                                .subtract(1, "day")
                                .format("YYYY-MM-DD");

                            setCurrentRange((prev) =>
                                prev.start !== startOfView || prev.end !== endOfView
                                    ? { start: startOfView, end: endOfView }
                                    : prev
                            );

                            setCurrentView(info.view.type);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default OwnCalendar;
