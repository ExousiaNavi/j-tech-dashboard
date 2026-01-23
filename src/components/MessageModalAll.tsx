import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSendToAll: (msg: string) => void;
}

export default function MessageModalAll({ open, onClose, onSendToAll }: Props) {
  const [text, setText] = useState("");

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-gray-900 w-[90%] md:w-[30%] rounded-lg shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-red-600 px-4 py-3 text-white font-bold">
          Broadcast Message to all connected device
        </div>

        {/* Body */}
        <div className="p-4">
          <textarea
            className="w-full bg-gray-300 text-gray-900 rounded-md p-2 h-32 focus:ring-red-500 focus:border-red-500"
            placeholder="Enter message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          ></textarea>
        </div>

        {/* Buttons */}
        <div className="p-2 -mt-4 flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-md bg-gray-500 hover:bg-gray-100"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="flex items-center gap-1 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
            onClick={() => {
              onSendToAll(text);
              setText("");
              onClose();
            }}
          >
            Broadcast
          </button>
        </div>

      </div>
    </div>
  );
}
