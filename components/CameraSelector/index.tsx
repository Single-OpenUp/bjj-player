import { buildPreviewSrc } from "@/utils";
import type { Camera } from "@/types";

interface CameraSelectorProps {
  cameras: Camera[];
  activeIndex: number;
  onSelectCamera: (index: number) => void;
}

export const CameraSelector = ({ cameras, activeIndex, onSelectCamera }: CameraSelectorProps) => {
  return (
    <div className="w-full lg:w-80 bg-gray-900 rounded-lg p-6">
      <h3 className="text-white text-xl font-semibold mb-6">Câmeras</h3>

      {/* Tatame Visual */}
      <div className="relative w-full aspect-square bg-gray-800 rounded-lg mb-6 border-4 border-gray-700">
        <div className="absolute inset-2 border-2 border-gray-600 rounded-lg" />

        {/* Camera Position Buttons */}
        {cameras.map((camera, index) => {
          const positions = [
            { top: "10%", left: "50%", transform: "translateX(-50%)" }, // top center
            { top: "50%", right: "10%", transform: "translateY(-50%)" }, // right center
            { bottom: "10%", left: "50%", transform: "translateX(-50%)" }, // bottom center
            { top: "50%", left: "10%", transform: "translateY(-50%)" }, // left center
            { top: "20%", left: "20%" }, // top-left
            { top: "20%", right: "20%" }, // top-right
            { bottom: "20%", right: "20%" }, // bottom-right
            { bottom: "20%", left: "20%" }, // bottom-left
          ];

          const position = positions[index % positions.length];

          return (
            <button
              key={camera.name}
              onClick={() => onSelectCamera(index)}
              className={`absolute w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${index === activeIndex
                  ? "bg-red-500 text-white scale-110 ring-4 ring-red-300"
                  : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }`}
              style={position}
              aria-label={`Selecionar ${camera.name}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      {/* Camera List */}
      <div className="space-y-2">
        {cameras.map((camera, index) => (
          <button
            key={camera.name}
            onClick={() => onSelectCamera(index)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${index === activeIndex
                ? "bg-red-500 text-white"
                : "bg-gray-800 text-gray-200 hover:bg-gray-700"
              }`}
          >
            <div className="w-16 h-12 bg-gray-700 rounded overflow-hidden shrink-0">
              <img
                src={buildPreviewSrc(camera.file.slug)}
                alt={camera.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">{camera.name}</div>
              <div className="text-xs opacity-75">Câmera {index + 1}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
