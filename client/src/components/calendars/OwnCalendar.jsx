import moment from "moment";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Calendar, Clock, Repeat } from "lucide-react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import interactionPlugin from "@fullcalendar/interaction";

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
            My Calendar (
            <span className="italic font-extrabold">{user.name}</span>)
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
            showNonCurrentDates={false}
            fixedWeekCount={false}
            nowIndicator
            ref={calendarRef}
            currentView={currentView}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            initialDate={moment().format("YYYY-MM-DD")} // Today in YYYY-MM-DD
            validRange={{
              start: moment().startOf("month").format("YYYY-MM-DD"),
            }}
            selectable
            selectAllow={(selectInfo) => {
              return moment(selectInfo.start).isSameOrAfter(moment(), "day");
            }}
            dayCellClassNames={(info) => {
              return moment(info.date).isBefore(moment(), "day")
                ? "opacity-40 pointer-events-none"
                : "";
            }}
            select={handleDateSelect}
            eventClick={handleEventClick}
            events={events}
            height="auto"
            titleFormat={{ year: "numeric", month: "long", day: "numeric" }}
            headerToolbar={false}
            buttonIcons={false}
            dayHeaderContent={(args) => {
              if (
                currentView === "timeGridWeek" ||
                currentView === "timeGridDay"
              ) {
                return (
                  <div style={{ cursor: "pointer" }}>
                    <h4 className="text-sm text-slate-700">
                      {moment(args.date).format("DD-MMM")}
                    </h4>
                    <span className="text-xs text-slate-500">
                      {moment(args.date).format("dddd")}
                    </span>
                  </div>
                );
              }
              if (currentView === "dayGridMonth") {
                return (
                  <div style={{ cursor: "pointer" }}>
                    <span className="text-xs text-slate-800">
                      {moment(args.date).format("ddd")}
                    </span>
                  </div>
                );
              }
            }}
            firstDay={1}
            weekends
            allDayText="All day"
            eventContent={(eventInfo) => {
              const { event } = eventInfo;
              const { title, start, end, extendedProps } = event;
              const isRecurring = !!extendedProps.ruleId;
              const tooltipId = `tooltip-${event.id}`;

              // Dynamic background based on status
              const bgColor =
                title === "AVAILABLE"
                  ? "bg-emerald-500"
                  : title === "BUSY"
                  ? "bg-red-500"
                  : title === "TENTATIVE"
                  ? "bg-amber-500"
                  : "bg-blue-500";

              const borderColor =
                title === "AVAILABLE"
                  ? "border-emerald-600"
                  : title === "BUSY"
                  ? "border-red-600"
                  : title === "TENTATIVE"
                  ? "border-amber-600"
                  : "border-blue-600";

              return (
                <>
                  {/* MAIN EVENT CARD */}
                  <div
                    data-tooltip-id={tooltipId}
                    className={`group relative flex flex-col p-1.5 h-full z-[999] w-full rounded-lg ${bgColor} text-white shadow-md border-1 ${borderColor} transition-all duration-200 hover:shadow-xl hover:scale-[1.02] cursor-pointer overflow-hidden`}
                  >
                    {/* Recurring Badge */}
                    {isRecurring && currentView !== "dayGridMonth" && (
                      <div className="absolute top-0 right-0 bg-white/30 backdrop-blur-sm rounded-full p-1">
                        <Repeat className="w-3 h-3 text-white drop-shadow" />
                      </div>
                    )}

                    {/* Time + Title */}
                    <div className="flex flex-row items-center justify-between gap-2 mt-0 mb-1">
                      <span className="text-[8px] font-bold tracking-wider">
                        {/* {moment(start).format("h:mm A")} –{" "}
                        {moment(end).format("h:mm A")} */}
                        {title === "LEAVE" ? (
                          " "
                        ) : (
                          <span>
                            {moment(start).format("h:mm A")} -{" "}
                            {moment(end).format("h:mm A")}
                          </span>
                        )}
                      </span>
                      {isRecurring && <Repeat className="w-4 h-4 opacity-80" />}
                    </div>

                    <div className="font-bold text-sm truncate mt-0.5">
                      {title}
                    </div>

                    {extendedProps.description && (
                      <div className="text-xs opacity-90 truncate mt-0.5 italic">
                        {extendedProps.description}
                      </div>
                    )}
                  </div>

                  {/* TOOLTIP */}
                  <ReactTooltip
                    id={tooltipId}
                    place="top"
                    effect="solid"
                    className="!bg-white !text-gray-800 !border !border-gray-200 !rounded-2xl !shadow-2xl !p-4 !max-w-xs !z-[9999]"
                    backgroundColor="white"
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-lg text-gray-900">
                          {title}
                        </h4>
                        {isRecurring && (
                          <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold">
                            <Repeat className="w-4 h-4" />
                            <span>Recurring</span>
                          </div>
                        )}
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {moment(start).format("dddd, MMMM Do YYYY")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 ml-6">
                        <span className="text-sm">
                          {moment(start).format("h:mm A")} –{" "}
                          {moment(end).format("h:mm A")}
                        </span>
                      </div>

                      {/* Description */}
                      {extendedProps.description && (
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 italic border-l-4 border-blue-400">
                          "{extendedProps.description}"
                        </div>
                      )}

                      {/* Footer */}
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        Click to edit or delete
                      </div>
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
