interface Props {
  show: boolean;
  orgId: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteOrgConfirmDialog({
  show,
  orgId,
  onCancel,
  onConfirm,
}: Props) {
  if (!show || !orgId) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-900/30">
            <svg
              className="w-6 h-6 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22m-5-4H6a2 2 0 00-2 2v2h16V5a2 2 0 00-2-2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Delete Organization
            </h3>
            <p className="text-sm text-gray-400">This action is irreversible</p>
          </div>
        </div>

        <p className="text-gray-300 mb-2">
          Are you sure you want to delete organization{" "}
          <span className="font-bold text-red-400">{orgId}</span>?
        </p>

         <div className="mb-6 p-3 rounded-lg border border-yellow-500/30 bg-gray-500/10  text-sm">
          <p className="font-medium mb-1 text-yellow-500 text-base">Important reminder:</p>
          <p className="text-white">
            If this organization has connected agents, they will automatically be
            assigned to the
            <span className="font-bold text-yellow-500 px-1">Unassigned</span>
            organization. You will need to run the setup on the agent and
            reconfigure its organization afterwards.
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium transition text-white bg-red-600 hover:bg-red-700"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}
