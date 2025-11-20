import moment from "moment";
import { Repeat, X } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Tooltip as ReactTooltip } from "react-tooltip";
import interactionPlugin from "@fullcalendar/interaction";
import CalendarToolbar from "./CalenderToolbar";

const TeammateCalendar = ({
  user,
  calendarRefAPI,
  calendarRef,
  events,
  onViewChange,
  currentView,
  removeCalendar,
}) => {
  if (!user) return null;

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
      {/* HEADER  */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-white text-xs font-semibold">
            {user?.name?.charAt(0).toUpperCase() +
              (user?.name.split(" ")[1]
                ? user?.name.split(" ")[1].charAt(0).toUpperCase()
                : "")}
          </div>
          <h3 className="font-semibold text-white">
            {user.name.charAt(0).toUpperCase() + user?.name?.slice(1)}'s
            Calendar (
            <span className="text-sm italic font-stretch-50%">
              {user?.email}
            </span>
            )
          </h3>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            className="cursor-pointer"
            onClick={() => removeCalendar(user)}
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* TOOLBAR  */}
      <CalendarToolbar calendarApi={calendarRefAPI} />

      {/* CALENDAR  */}
      <div className="p-3 sm:p-4 h-full max-h-[calc(100vh-250px)] overflow-auto">
        <div className="min-w-[900px] overflow-x-auto h-full">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            initialDate={moment()._d}
            events={events}
            height="auto"
            headerToolbar={false}
            buttonIcons={false}
            firstDay={1}
            allDayText="All day"
            nowIndicator
            datesSet={(arg) => onViewChange(arg.view.type)}
            currentView={currentView}
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
            eventContent={(info) => {
              const { title, start, end, extendedProps } = info.event;
              const tooltipId = `event-tooltip-${info.event._def.publicId}`;

              return (
                <>
                  <div data-tooltip-id={tooltipId} className="p-1 text-xs">
                    <div className="flex items-center justify-between">
                      {moment(start).format("HH:mm")} -{" "}
                      {moment(end).format("HH:mm")}
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
                    className="text-xs z-100"
                  >
                    <div>
                      <strong>{title}</strong>
                    </div>
                    <div>
                      Time: {moment(start).format("HH:mm")} -{" "}
                      {moment(end).format("HH:mm")}
                    </div>
                    {extendedProps.description && (
                      <div>Description: {extendedProps.description}</div>
                    )}
                    {extendedProps.recurringRule && (
                      <div>
                        Recurring:
                        <Repeat className="w-3 h-3 inline-block text-white ml-1" />
                      </div>
                    )}
                  </ReactTooltip>
                </>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TeammateCalendar;
