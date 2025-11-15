import { Save, X } from "lucide-react";

const ProfileModal = ({
    profileModalOpen,
    setProfileModalOpen,
    editForm,
    setEditForm,
    UpdateCurrentUser
}) => {
    if (!profileModalOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
            <div className="bg-white rounded-xl w-full max-w-md shadow-lg animate-fadeIn">

                {/* Header */}
                <div className="flex items-center justify-between text-white p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
                    <h2 className="text-lg font-semibold ">Edit Profile</h2>
                    <button onClick={() => setProfileModalOpen(false)} className="cursor-pointer">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) =>
                                setEditForm({ ...editForm, name: e.target.value })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                        <input
                            type="text"
                            value={editForm.department}
                            onChange={(e) =>
                                setEditForm({ ...editForm, department: e.target.value })
                            }
                            className="w-full  px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 flex justify-end gap-2">
                    <button
                        onClick={() => setProfileModalOpen(false)}
                        className="cursor-pointer flex-1 sm:flex-none px-5 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={async () => {
                            await UpdateCurrentUser(editForm);
                            setProfileModalOpen(false);
                        }}
                        className="cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                    >
                        <Save className="w-4 h-4" />
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
