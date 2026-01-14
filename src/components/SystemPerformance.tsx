interface Props {
  cpu: number;
  ram: number;
  disk: number;
  network: {
    upload_kbps: number
    download_kbps: number
  };
  isFullscreen: boolean;
}

export default function SystemPerformance({cpu, ram, disk, network, isFullscreen} : Props) {
    // return if not fullscreen
    if(isFullscreen) return;

    // else render this card
    return (
        <div className="p-6 bg-gray-900 border-t border-gray-800">
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              System Performance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CPU Card */}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-red-900/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-red-400">
                        CPU
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-300">
                      Processor
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                    style={{ width: `${cpu}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>{cpu}%</span>
                  <span>Load</span>
                  <span>100%</span>
                </div>
              </div>

              {/* RAM Card */}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-400">
                        RAM
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-300">
                      Memory
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
                    style={{ width: `${ram}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>{ram}%</span>
                  <span>Usage</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Disk Card */}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-green-900/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-green-400">
                        DISK
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-300">
                      Storage
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                    style={{ width: `${disk}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>{disk}%</span>
                  <span>Space</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Network Card */}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-900/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-cyan-400">
                        NET
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-300">
                      Network
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex justify-between">
                    <span>Upload</span>
                    <span className="font-semibold text-red-500">
                      {network.upload_kbps} kb/s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Download</span>
                    <span className="text-green-500 font-semibold">
                      {network.download_kbps} kb/s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    )
}