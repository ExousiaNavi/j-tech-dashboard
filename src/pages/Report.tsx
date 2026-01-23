// src/pages/Reports.tsx
import { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_URL } from "../config";
import { getDefaultDateRange } from "../helpers/dateHelper";

// Add jsPDF-autotable to jsPDF prototype
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: { finalY: number };
    autoTable: (options: any) => jsPDF;
  }
}

interface Metric {
  alerts: string[];
  // you can add cpu, ram, etc., if needed
}

interface LabData {
  [pcName: string]: Metric[];
}

interface ComputerMetric {
  timestamp: string;
  cpu: number;
  ram: number;
  disk: number;
  network: { upload_kbps: number; download_kbps: number };
  uptime_hours: number;
  battery: { percent: number; plugged: boolean } | null;
  alerts: string[];
}

// Sample monitoring data (fallback)
// const monitoringData: Record<string, Record<string, ComputerMetric[]>> = {
//   "Lab 2": {
//     "BAJ-LAP-012": [
//       {
//         timestamp: "2026-01-21T09:00:00.009265",
//         cpu: 1.6,
//         ram: 54.1,
//         disk: 16.2,
//         network: { upload_kbps: 0.06, download_kbps: 0 },
//         uptime_hours: 306.29,
//         battery: { percent: 97, plugged: true },
//         alerts: [],
//       },
//       {
//         timestamp: "2026-01-21T10:00:00.076622",
//         cpu: 1.3,
//         ram: 53.2,
//         disk: 16.2,
//         network: { upload_kbps: 4.24, download_kbps: 0.18 },
//         uptime_hours: 307.29,
//         battery: { percent: 97, plugged: true },
//         alerts: [],
//       },
//       {
//         timestamp: "2026-01-21T11:00:00.031693",
//         cpu: 2.9,
//         ram: 63.8,
//         disk: 16.2,
//         network: { upload_kbps: 0.47, download_kbps: 0.82 },
//         uptime_hours: 308.29,
//         battery: { percent: 97, plugged: true },
//         alerts: [],
//       },
//     ],
//   },
//   "Lab 1": {
//     "DESKTOP-09177SS": [
//       {
//         timestamp: "2026-01-21T09:00:00.030486",
//         cpu: 39.8,
//         ram: 82,
//         disk: 38.6,
//         network: { upload_kbps: 0.79, download_kbps: 1.86 },
//         uptime_hours: 0.73,
//         battery: null,
//         alerts: ["Low disk space on C:\\"],
//       },
//       {
//         timestamp: "2026-01-21T10:00:00.104886",
//         cpu: 15.4,
//         ram: 84.5,
//         disk: 38.6,
//         network: { upload_kbps: 4.55, download_kbps: 159.94 },
//         uptime_hours: 1.73,
//         battery: null,
//         alerts: ["Low disk space on C:\\"],
//       },
//       {
//         timestamp: "2026-01-21T11:00:00.113660",
//         cpu: 7.3,
//         ram: 86.8,
//         disk: 38.6,
//         network: { upload_kbps: 0, download_kbps: 0.16 },
//         uptime_hours: 2.73,
//         battery: null,
//         alerts: ["Low disk space on C:\\"],
//       },
//     ],
//   },
// };

// Metrics
const availableMetrics = [
  { id: "cpu", label: "CPU Usage", unit: "%", enabled: true },
  { id: "ram", label: "RAM Usage", unit: "%", enabled: true },
  { id: "disk", label: "Disk Usage", unit: "%", enabled: true },
  { id: "network", label: "Network", unit: "kbps", enabled: true },
  { id: "uptime", label: "Uptime", unit: "hours", enabled: true },
  { id: "battery", label: "Battery", unit: "%", enabled: true },
  { id: "alerts", label: "Alerts", unit: "count", enabled: true },
];

export default function Reports() {
  // const navigate = useNavigate();
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState(availableMetrics);
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  // const [reportsDataByDate, setReportsDataByDate] = useState<
  //   Record<string, any>
  // >({});
  const isInitialLoad = useRef(true);
  const [mergedReportsData, setMergedReportsData] = useState<
    Record<string, any>
  >({});
  const [reportName, setReportName] = useState(
    "Computer Lab Monitoring Report",
  );
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 7;

  // Filtered labs
  const filteredData: Record<string, Record<string, ComputerMetric[]>> = {};
  selectedLabs.forEach((lab) => {
    if (mergedReportsData[lab]) filteredData[lab] = mergedReportsData[lab];
  });

  // Get historical metrics - prefer merged server data
  const getHistoricalMetrics = (labName: string, computerName: string) => {
    if (
      mergedReportsData[labName] &&
      mergedReportsData[labName][computerName]
    ) {
      return mergedReportsData[labName][computerName];
    }
    return mergedReportsData[labName][computerName];
  };

  // Toggle functions
  const toggleMetric = (id: string) =>
    setSelectedMetrics((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
    );
  const toggleAllMetrics = (enable: boolean) =>
    setSelectedMetrics((prev) => prev.map((m) => ({ ...m, enabled: enable })));
  const toggleLab = (labName: string) =>
    setSelectedLabs((prev) =>
      prev.includes(labName)
        ? prev.filter((l) => l !== labName)
        : [...prev, labName],
    );
  const toggleAllLabs = (enable: boolean) =>
    setSelectedLabs(enable ? labs.map((l) => l.name) : []);

  // ============ PDF Export ============
  const exportToPDF = () => {
    setIsGeneratingPDF(true);
    setTimeout(() => {
      try {
        const doc = new jsPDF("portrait", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const FOOTER_HEIGHT = 20;
        const SAFE_BOTTOM = pageHeight - FOOTER_HEIGHT;
        const RED: [number, number, number] = [220, 53, 69],
        DARK: [number, number, number] = [40, 40, 40],
        GRAY: [number, number, number] = [120, 120, 120],
        LIGHT_GRAY: [number, number, number] = [200, 200, 200];

        let currentY = 20;

        const drawFooter = () => {
          const total = doc.getNumberOfPages();
          const page = doc.getCurrentPageInfo().pageNumber;
          doc.setFontSize(8);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(...GRAY);
          doc.text(`Page ${page} of ${total}`, pageWidth / 2, pageHeight - 10, {
            align: "center",
          });
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...RED);
          doc.text(
            "CONFIDENTIAL - JP-TECHNOLOGY INTERNAL USE ONLY",
            pageWidth / 2,
            pageHeight - 5,
            { align: "center" },
          );
        };

        const ensureSpace = (needed: number) => {
          if (currentY + needed > SAFE_BOTTOM) {
            doc.addPage();
            currentY = margin;
          }
        };

        // Cover Page
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...RED);
        doc.text("JP-TECHNOLOGY", pageWidth / 2, currentY, { align: "center" });
        currentY += 10;
        doc.setFontSize(16);
        doc.setTextColor(...DARK);
        doc.text("COMPUTER LAB MONITORING REPORT", pageWidth / 2, currentY, {
          align: "center",
        });
        currentY += 10;
        [
          ["Report Name:", reportName],
          ["Date Range:", `${dateRange.start} to ${dateRange.end}`],
          ["Generated:", new Date().toLocaleDateString()],
          ["Report ID:", `JP-${Date.now().toString().slice(-8)}`],
          ["Selected Labs:", selectedLabs.join(", ")],
        ].forEach(([label, value]) => {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(label, margin, currentY);
          doc.setFont("helvetica", "normal");
          doc.text(value as string, margin + 45, currentY);
          currentY += 6;
        });

        // Lab Overview
        const labSummaryData = selectedLabs.map((labName) => {
          const pcs = Object.keys(
            getHistoricalMetrics(
              labName,
              Object.keys(
                mergedReportsData[labName] || mergedReportsData[labName],
              )[0],
            )
              ? mergedReportsData[labName]
              : mergedReportsData[labName],
          );
          let totalAlerts = 0,
            affected = 0;
          pcs.forEach((pc) => {
            const allMetrics = getHistoricalMetrics(labName, pc);
            allMetrics.forEach((m: { alerts: string | any[]; }) => {
              totalAlerts += m.alerts.length;
            });
            if (
              allMetrics.some(
                (m: { alerts: string | any[]; cpu: number; ram: number; }) => m.alerts.length > 0 || m.cpu > 80 || m.ram > 85,
              )
            )
              affected++;
          });
          return [
            labName,
            pcs.length,
            affected,
            totalAlerts,
            totalAlerts > 0 ? "NEEDS ATTENTION" : "OPERATIONAL",
          ];
        });

        autoTable(doc, {
          startY: currentY,
          head: [["Lab", "Computers", "Affected", "Total Alerts", "Status"]],
          body: labSummaryData,
          theme: "grid",
          margin: { left: margin, right: margin, bottom: FOOTER_HEIGHT },
          tableWidth: pageWidth - 2 * margin,
          styles: {
            fontSize: 9,
            cellPadding: 3,
            textColor: DARK,
            lineColor: LIGHT_GRAY,
          },
          headStyles: {
            fillColor: [0, 0, 0],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          didDrawPage: drawFooter,
        });
        currentY = doc.lastAutoTable.finalY + 8;

        // Lab Sections
        selectedLabs.forEach((lab) => {
          currentY += 6;
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...DARK);
          doc.text(`${lab}`, margin, currentY);
          currentY += 3;
          doc.setDrawColor(...RED);
          doc.setLineWidth(0.8);
          doc.line(margin, currentY, pageWidth - margin, currentY);
          currentY += 8;

          const labData = mergedReportsData[lab] || mergedReportsData[lab];
          Object.keys(labData ?? {}).forEach((pc) => {
            const allMetrics = getHistoricalMetrics(lab, pc);
            allMetrics.forEach((metric: { alerts: any[]; cpu: number; ram: number; timestamp: string | number | Date; disk: any; network: { upload_kbps: any; download_kbps: any; }; uptime_hours: number; battery: { percent: any; }; }) => {
              // const hasCriticalAlert =
              //   metric.alerts.length > 0 || metric.cpu > 80 || metric.ram > 85;
              ensureSpace(30);
              doc.setFontSize(11);
              doc.setFont("helvetica", "bold");
              doc.setTextColor(...DARK);
              doc.text(`Computer: ${pc}`, margin, currentY);
              currentY += 5;
              doc.setFontSize(9);
              doc.setFont("helvetica", "normal");
              doc.text(
                `Timestamp: ${new Date(metric.timestamp).toLocaleString()}`,
                margin,
                currentY,
              );
              currentY += 5;

              if (metric.alerts.length > 0) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.setTextColor(...RED);
                doc.text(
                  "ACTIVE ALERTS - REQUIRES ATTENTION",
                  margin,
                  currentY,
                );
                currentY += 5;
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                metric.alerts.forEach((a) => {
                  doc.text(`- ${a}`, margin, currentY);
                  currentY += 4;
                });
                currentY += 6;
                doc.setTextColor(...DARK);
              }

              const rows = selectedMetrics
                .filter((m) => m.enabled)
                .map((m) => {
                  let value = "",
                    status = "NORMAL";
                  switch (m.id) {
                    case "cpu":
                      value = `${metric.cpu}%`;
                      break;
                    case "ram":
                      value = `${metric.ram}%`;
                      break;
                    case "disk":
                      value = `${metric.disk}%`;
                      break;
                    case "network":
                      value = `Up ${metric.network.upload_kbps}k / Down ${metric.network.download_kbps}k`;
                      break;
                    case "uptime":
                      value = `${Math.floor(metric.uptime_hours / 24)}d ${Math.floor(metric.uptime_hours % 24)}h`;
                      break;
                    case "battery":
                      value = metric.battery
                        ? `${metric.battery.percent}%`
                        : "N/A";
                      break;
                    case "alerts":
                      value = metric.alerts.length.toString();
                      break;
                  }
                  return [m.label, value, status];
                });

              autoTable(doc, {
                startY: currentY,
                head: [["Metric", "Value", "Status"]],
                body: rows,
                theme: "grid",
                margin: { left: margin, right: margin, bottom: FOOTER_HEIGHT },
                tableWidth: pageWidth - 2 * margin,
                styles: {
                  fontSize: 8,
                  cellPadding: 2,
                  textColor: DARK,
                  lineColor: LIGHT_GRAY,
                },
                headStyles: {
                  fillColor: [0, 0, 0],
                  textColor: [255, 255, 255],
                  fontStyle: "bold",
                },
                didDrawPage: drawFooter,
              });
              currentY = doc.lastAutoTable.finalY + 8;
            });
          });
        });

        drawFooter();
        doc.save(
          `JP-Tech_${reportName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
        );
      } catch (e) {
        console.error(e);
        alert("PDF generation failed.");
      } finally {
        setIsGeneratingPDF(false);
      }
    }, 800);
  };

  // Fetch reports from server
  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: dateRange.start, end: dateRange.end }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const response = await res.json();

      // setReportsDataByDate(response.data);

      // Merge all dates
      const mergedData: Record<string, Record<string, any[]>> = {};
      Object.values(response.data).forEach((dailyData: any) => {
        for (const labName in dailyData) {
          if (!mergedData[labName]) mergedData[labName] = {};
          for (const compName in dailyData[labName]) {
            if (!mergedData[labName][compName])
              mergedData[labName][compName] = [];
            mergedData[labName][compName].push(...dailyData[labName][compName]);
          }
        }
      });
      //   console.log(mergedData)
      setMergedReportsData(mergedData);
      // FIRST LOAD DEFAULT SELECTION
      const labNames = Object.keys(mergedData);

      if (isInitialLoad.current && labNames.length > 0) {
        setSelectedLabs([labNames[0]]);
        isInitialLoad.current = false;
      }
      // // Set default selected lab to the first one in merged data
      // const firstLab = Object.keys(mergedData)[0];
      // if (firstLab && selectedLabs.length === 0) {
      //   setSelectedLabs([firstLab]);
      // }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  };

  // Labs info
const labs = Object.keys(mergedReportsData).map((labName, index) => {
  const lab: LabData = mergedReportsData[labName];

  return {
    id: index + 1,
    name: labName,
    computerCount: Object.keys(lab).length,
    alertCount: Object.values(lab).reduce((sum: number, comps: Metric[]) => {
      return sum + comps.reduce((s: number, m: Metric) => s + m.alerts.length, 0);
    }, 0),
  };
});

  // Flatten all rows first
  const allRows = selectedLabs.flatMap((labName) => {
    const labData = mergedReportsData[labName as keyof typeof mergedReportsData];
    // Guard: skip if labData is null/undefined
  if (!labData) return [];
    return Object.keys(labData).flatMap((computerName) => {
      const historicalMetrics = getHistoricalMetrics(labName, computerName);

      return historicalMetrics.map(
        (
          metric: {
            alerts: string | any[];
            cpu: number;
            ram: number;
            timestamp: string | number | Date;
          },
          index: any,
        ) => {
          const hasCriticalAlert =
            metric.alerts.length > 0 || metric.cpu > 80 || metric.ram > 85;

          const timestamp = new Date(metric.timestamp);
          const formattedTime = timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
          const formattedDate = timestamp.toLocaleDateString();

          return {
            labName,
            computerName,
            metric,
            index,
            formattedDate,
            formattedTime,
            hasCriticalAlert,
          };
        },
      );
    });
  });

  //   const rowsPerPage = 7; // you can make this dynamic
  const totalPages = Math.ceil(allRows.length / rowsPerPage);
  const paginatedRows = allRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const totalDataPoints = Object.values(mergedReportsData).reduce(
    (labAcc: number, lab) => {
      return (
        labAcc +
        Object.values(lab).reduce((compAcc: number, metricsArray) => {
          // Narrow unknown to array
          if (Array.isArray(metricsArray)) {
            return compAcc + metricsArray.length;
          }
          return compAcc;
        }, 0) // initial compAcc = 0
      );
    },
    0, // initial labAcc = 0
  );

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchReports();
    }
  }, [selectedLabs, dateRange]);

  // Rest of the component remains the same as before, but with updated PDF export button
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            JP-TECHNOLOGY REPORTS
          </h1>
          <p className="text-gray-400">
            Professional Computer Lab Monitoring Reports
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Report Settings Card */}
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Report Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Report Name
                </label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm"
                  placeholder="Enter report name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, end: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={exportToPDF}
                  disabled={isGeneratingPDF}
                  className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPDF ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Export to PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Lab Selection Card */}
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Laboratory
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleAllLabs(true)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  All
                </button>
                <span className="text-gray-600">|</span>
                <button
                  onClick={() => toggleAllLabs(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  None
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {labs
                .slice() // create a copy so original array isn't mutated
                .sort((a, b) => {
                  // Sort by alertCount descending
                  if (b.alertCount !== a.alertCount)
                    return b.alertCount - a.alertCount;
                  // If alertCount is equal, sort by name ascending
                  return a.name.localeCompare(b.name);
                })
                .map((lab) => (
                  <div
                    key={lab.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-800/20 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLabs.includes(lab.name)}
                      onChange={() => toggleLab(lab.name)}
                      className="rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white">{lab.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {lab.computerCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Metric Selection Card */}
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Metrics
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleAllMetrics(true)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  All
                </button>
                <span className="text-gray-600">|</span>
                <button
                  onClick={() => toggleAllMetrics(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  None
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {selectedMetrics.map((metric) => (
                <div
                  key={metric.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-800/20 rounded"
                >
                  <input
                    type="checkbox"
                    checked={metric.enabled}
                    onChange={() => toggleMetric(metric.id)}
                    className="rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-600"
                  />
                  <span className="text-sm text-white flex-1">
                    {metric.label}
                  </span>
                  <span className="text-xs text-gray-400">{metric.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Report Display */}
        <div className="lg:col-span-3">
          {/* Report Header */}
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 mb-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">
                {reportName}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
                <span>
                  Date Range: {dateRange.start} to {dateRange.end}
                </span>
                <span>•</span>
                <span>Generated: {new Date().toLocaleDateString()}</span>
                <span>•</span>
                <span>Selected Labs: {selectedLabs.length}</span>
                <span>•</span>
                <span>
                  Report ID: JP-{new Date().getTime().toString().slice(-8)}
                </span>
              </div>
            </div>
          </div>

          {/* Lab Overview Table */}
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Lab Overview</h2>
              <p className="text-sm text-gray-400">
                Summary of selected computer labs
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/50">
                    <th className="py-3 px-4 text-left text-gray-300 font-medium">
                      Lab
                    </th>
                    <th className="py-3 px-4 text-left text-gray-300 font-medium">
                      Computers
                    </th>
                    <th className="py-3 px-4 text-left text-gray-300 font-medium">
                      Avg CPU %
                    </th>
                    <th className="py-3 px-4 text-left text-gray-300 font-medium">
                      Avg RAM %
                    </th>
                    <th className="py-3 px-4 text-left text-gray-300 font-medium">
                      Alerts
                    </th>
                    <th className="py-3 px-4 text-left text-gray-300 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLabs.map((labName) => {
                    const labData =
                      mergedReportsData[labName as keyof typeof mergedReportsData];
                    const computers = Object.keys(labData ?? {});

                    // Compute averages and alerts using all historical metrics
                    let totalCPU = 0;
                    let totalRAM = 0;
                    let totalAlerts = 0;
                    let totalMetricsCount = 0;
                    let criticalComputers = 0;

                    computers.forEach((comp) => {
                      const allMetrics = getHistoricalMetrics(labName, comp);
                      allMetrics.forEach((metric: { cpu: number; ram: number; alerts: string | any[]; }) => {
                        totalCPU += metric.cpu;
                        totalRAM += metric.ram;
                        totalAlerts += metric.alerts.length;
                        totalMetricsCount++;
                      });

                      // If any metric for this computer is critical
                      if (
                        allMetrics.some(
                          (m: { alerts: string | any[]; cpu: number; ram: number; }) =>
                            m.alerts.length > 0 || m.cpu > 80 || m.ram > 85,
                        )
                      ) {
                        criticalComputers++;
                      }
                    });

                    const avgCPU = totalMetricsCount
                      ? totalCPU / totalMetricsCount
                      : 0;
                    const avgRAM = totalMetricsCount
                      ? totalRAM / totalMetricsCount
                      : 0;
                    const status =
                      totalAlerts > 0 ? "REQUIRES ATTENTION" : "OPERATIONAL";

                    return (
                      <tr
                        key={labName}
                        className="border-t border-gray-800/50 hover:bg-gray-800/20 transition-colors"
                      >
                        <td className="py-3 px-4 text-white font-medium">
                          {labName}
                        </td>
                        <td className="py-3 px-4 text-white text-center">
                          {computers.length}
                        </td>
                        <td
                          className={`py-3 px-4 text-center font-medium ${
                            avgCPU > 80
                              ? "text-red-400"
                              : avgCPU > 60
                                ? "text-yellow-400"
                                : "text-green-400"
                          }`}
                        >
                          {avgCPU.toFixed(1)}%
                        </td>
                        <td
                          className={`py-3 px-4 text-center font-medium ${
                            avgRAM > 85
                              ? "text-red-400"
                              : avgRAM > 70
                                ? "text-yellow-400"
                                : "text-green-400"
                          }`}
                        >
                          {avgRAM.toFixed(1)}%
                        </td>
                        <td
                          className={`py-3 px-4 text-center font-medium ${
                            totalAlerts > 0 ? "text-red-400" : "text-green-400"
                          }`}
                        >
                          {totalAlerts}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              status === "OPERATIONAL"
                                ? "bg-green-500/10 text-green-300 border border-green-500/30"
                                : "bg-red-500/10 text-red-300 border border-red-500/30"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Computer Status - Showing ALL historical data with proper styling */}
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">
                Detailed Computer Status
              </h2>
              <p className="text-sm text-gray-400">
                All historical metrics for each computer
              </p>
            </div>

            {/* Container with horizontal scroll */}
            <div className="overflow-x-auto max-h-[600px]">
              {/* Added max height */}
              <table className="w-full min-w-max">
                {/* Added min-width */}
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-800/30 backdrop-blur-sm">
                    <th className="py-3 px-4 text-left text-gray-300 font-medium text-sm whitespace-nowrap sticky left-0 bg-gray-950 border-b-2">
                      Lab
                    </th>
                    <th className="py-3 px-4 text-left text-gray-300 font-medium text-sm whitespace-nowrap sticky left-14 bg-gray-950 border-b-2">
                      Computer
                    </th>
                    <th className="py-3 px-4 text-left text-gray-300 font-medium text-sm whitespace-nowrap min-w-[180px]">
                      Timestamp
                    </th>
                    {selectedMetrics
                      .filter((m) => m.enabled)
                      .map((metric) => (
                        <th
                          key={metric.id}
                          className="py-3 px-4 text-left text-gray-300 font-medium text-sm whitespace-nowrap min-w-[100px]"
                        >
                          {metric.label}
                        </th>
                      ))}
                    <th className="py-3 px-4 text-left text-gray-300 font-medium text-sm whitespace-nowrap min-w-[120px]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map(
                    ({
                      labName,
                      computerName,
                      metric,
                      index,
                      formattedDate,
                      formattedTime,
                      hasCriticalAlert,
                    }) => (
                      <tr
                        key={`${labName}-${computerName}-${index}`}
                        className="hover:bg-gray-800/20 transition-colors border-b-2 border-gray-800"
                      >
                        {/* Lab */}
                        <td className="py-2 px-4 text-white text-sm font-medium whitespace-nowrap sticky left-0 bg-gray-950">
                          {index === 0 ? labName : ""}
                        </td>

                        {/* Computer */}
                        <td className="py-2 px-4 text-gray-300 font-mono text-xs whitespace-nowrap sticky left-14 bg-gray-950">
                          {index === 0 ? computerName : ""}
                        </td>

                        {/* Timestamp */}
                        <td className="py-2 px-4 text-gray-400 text-xs whitespace-nowrap">
                          <div className="flex flex-col">
                            <span>{formattedDate}</span>
                            <span className="text-gray-500">
                              {formattedTime}
                            </span>
                          </div>
                        </td>

                        {/* Metrics */}
                        {selectedMetrics
                          .filter((m) => m.enabled)
                          .map((metricObj) => {
                            let value = "";
                            let color = "text-gray-300";

                            switch (metricObj.id) {
                              case "cpu":
                                value = `${metric.cpu}%`;
                                color =
                                  metric.cpu > 80
                                    ? "text-red-400"
                                    : metric.cpu > 60
                                      ? "text-yellow-400"
                                      : "text-green-400";
                                break;
                              case "ram":
                                value = `${metric.ram}%`;
                                color =
                                  metric.ram > 85
                                    ? "text-red-400"
                                    : metric.ram > 70
                                      ? "text-yellow-400"
                                      : "text-green-400";
                                break;
                              case "disk":
                                value = `${metric.disk}%`;
                                color =
                                  metric.disk > 90
                                    ? "text-red-400"
                                    : metric.disk > 70
                                      ? "text-yellow-400"
                                      : "text-green-400";
                                break;
                              case "network":
                                value = `↑${metric.network.upload_kbps}k\n↓${metric.network.download_kbps}k`;
                                color = "text-blue-400";
                                break;
                              case "uptime":
                                const days = Math.floor(
                                  metric.uptime_hours / 24,
                                );
                                const hours = Math.floor(
                                  metric.uptime_hours % 24,
                                );
                                value = `${days}d ${hours}h`;
                                color = "text-purple-400";
                                break;
                              case "battery":
                                value = metric.battery
                                  ? `${metric.battery.percent}%`
                                  : "N/A";
                                color =
                                  metric.battery?.percent &&
                                  metric.battery.percent < 20
                                    ? "text-red-400"
                                    : "text-green-400";
                                break;
                              case "alerts":
                                value =
                                  metric.alerts.length > 0
                                    ? `${metric.alerts.length}`
                                    : "0";
                                color =
                                  metric.alerts.length > 0
                                    ? "text-red-400"
                                    : "text-green-400";
                                break;
                            }

                            return (
                              <td
                                key={metricObj.id}
                                className={`py-2 px-4 ${color} text-sm font-medium whitespace-pre-line`}
                              >
                                {value}
                              </td>
                            );
                          })}

                        {/* Status */}
                        <td className="py-2 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              hasCriticalAlert
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : "bg-green-500/20 text-green-300 border border-green-500/30"
                            }`}
                          >
                            {hasCriticalAlert ? "Needs Attention" : "Normal"}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Summary */}
            <div className="p-4 border-t border-gray-700 bg-gray-800/20">
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>Available {totalDataPoints} rows</span>

                <div className="flex justify-center items-center mt-4 space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500"
                  >
                    Prev
                  </button>

                  <span className="text-gray-300">
                    Page {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500"
                  >
                    Next
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Normal
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    Warning
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Critical
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-800 text-center">
        <p className="text-gray-500 text-sm">
          JP-Technology Computer Monitoring System • Professional Reporting
          Module
        </p>
      </div>
    </div>
  );
}
