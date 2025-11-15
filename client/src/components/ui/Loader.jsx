import { LoaderCircle } from "lucide-react";

export default function Loader({ message = "Loading..." }) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md">
            <div className="flex flex-col items-center gap-5">

                {/* Animated Colorful Ring */}
                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 p-[3px] animate-spin-slow">
                    <div className="h-full w-full rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center">
                        <LoaderCircle className="h-10 w-10 text-white animate-spin" />
                    </div>
                </div>

                {/* Text */}
                <p className="text-white text-xl font-semibold animate-pulse tracking-wide">
                    {message}
                </p>
            </div>
        </div>
    );
}
