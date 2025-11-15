import {
    X,
    Search,
    Filter,
    Users,
    Check,
    User,
    LogOut
} from "lucide-react";
import LogoImage from "../../assets/logo.png";

const Sidebar = ({
    sidebarOpen,
    setSidebarOpen,
    user,
    searchTerm,
    setSearchTerm,
    departmentFilter,
    setDepartmentFilter,
    allUsers,
    filteredUsers,
    selectedUsers,
    toggleUserSelection,
    setProfileModalOpen,
    handleLogout,
}) => {
    return (
        <>
            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:relative inset-y-0 left-0 z-50
                    w-80 bg-gradient-to-l from-blue-200 to-indigo-400 shadow-xl/30 shadow-neutral-900
                    transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    flex flex-col
                `}
            >
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-blue-600 via-50% to-blue-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <img src={LogoImage} alt="Logo" className="w-10 h-10 rounded-full border-2 border-white" />
                            </div>
                            <div>
                                <h2 className="text-md font-bold text-white">Multi-user Calendar</h2>
                                <p className="text-xs text-blue-100">Select to view calendars</p>
                            </div>
                        </div>

                        {/* Close Button (Mobile) */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 hover:bg-white/20 rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Logged-in User Section */}
                    <div className="flex items-center gap-2 text-sm text-blue-100">
                        <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white font-semibold">
                            {user.name?.charAt(0).toUpperCase() +
                                (user?.name.split(" ")[1]
                                    ? user?.name.split(" ")[1].charAt(0).toUpperCase()
                                    : "")}
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="font-medium text-white">{user.name}</span>
                            <span className="font-medium text-white/60">{user.email}</span>
                        </div>
                    </div>
                </div>

                {/* Search + Filter */}
                <div className="p-4 shadow-sm bg-gradient-to-l from-blue-200 to-indigo-400 space-y-4">
                    {/* Search */}
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

                    {/* Filter */}
                    <div className="relative">
                        <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-xl bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                        >
                            <option value="">All Departments</option>
                            {[...new Set(allUsers.map((u) => u.department))].map((dept) => (
                                <option key={dept} value={dept}>
                                    {dept}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-8 text-white">
                            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No team members found</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredUsers.map((u) => {
                                const isSelected = selectedUsers.some((sel) => sel?.id === u?.id);

                                return (
                                    <label
                                        key={u.id}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-lg cursor-pointer
                                            transition-all duration-200
                                            ${isSelected
                                                ? 'bg-blue-100 backdrop-blur-lg shadow-sm shadow-blue/30'
                                                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                            }
                                        `}
                                    >
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleUserSelection(u)}
                                                className="sr-only"
                                            />
                                            <div
                                                className={`
                                                    w-5 h-5 rounded border-2 flex items-center justify-center
                                                    transition-colors
                                                    ${isSelected
                                                        ? 'bg-blue-500 border-blue-500'
                                                        : 'bg-white border-gray-300'
                                                    }
                                                `}
                                            >
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-1">
                                            <div
                                                className={`
                                                    w-8 h-8 rounded-full flex items-center justify-center
                                                    text-sm font-semibold
                                                    ${isSelected
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-gray-300 text-gray-700'
                                                    }
                                                `}
                                            >
                                                {u.name?.charAt(0).toUpperCase() +
                                                    (u?.name.split(" ")[1]
                                                        ? u?.name.split(" ")[1].charAt(0).toUpperCase()
                                                        : "")}
                                            </div>

                                            <span
                                                className={`
                                                    text-sm font-medium
                                                    ${isSelected ? 'text-blue-900' : 'text-gray-700'}
                                                `}
                                            >
                                                {u.name.charAt(0).toUpperCase() + u?.name?.slice(1)}
                                                <span className="block text-xs italic text-gray-500">{u.email}{" "}(<span className="uppercase text-[10px]">{u?.department}</span>)</span>
                                            </span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-4 bg-gradient-to-r from-blue-600 via-50% to-blue-700 space-y-3">
                    <button
                        type="button"
                        onClick={() => setProfileModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black/70 outline-0 border-0 rounded-2xl font-medium cursor-pointer"
                    >
                        <User className="w-4 h-4" />
                        Edit Profile
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-100 text-amber-800 rounded-2xl font-medium cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Overlay (Mobile only) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </>
    );
};

export default Sidebar;
