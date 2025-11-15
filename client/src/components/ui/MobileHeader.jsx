import { Calendar, Menu } from "lucide-react";
import LogoImage from "../../assets/logo.png";

const MobileHeader = ({ title, sidebarOpen, setSidebarOpen }) => {
    return (
        <div className="lg:hidden bg-white px-4 py-3 flex items-center justify-between shadow-sm">
            {/* Left Section */}
            <div className="flex items-center gap-2">
                <img src={LogoImage} alt="Logo" className="w-10 h-10 rounded-full border-2 border-white" />
                <h1 className="text-lg font-bold text-gray-800">{title}</h1>
            </div>

            {/* Menu Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Menu className="w-6 h-6 text-gray-600" />
            </button>
        </div>
    );
};

export default MobileHeader;
