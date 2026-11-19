// WorkSense AI - Report Generator & Multi-Format Exporter

class ReportManager {
  generateReportData(type, department, dateRange) {
    const employees = window.appState ? window.appState.employees : [];
    const attendance = window.appState ? window.appState.attendance : [];
    const alerts = window.appState ? window.appState.alerts : [];

    let filteredEmployees = employees;
    if (department && department !== 'All') {
      filteredEmployees = employees.filter(e => e.department === department);
    }

    if (type === 'attendance') {
      return attendance.map(att => ({
        'Employee ID': att.employeeId,
        'Employee Name': att.name,
        'Department': att.department,
        'Date': att.date,
        'Check-In': att.checkIn || 'N/A',
        'Check-Out': att.checkOut || 'Active',
        'Duration': `${Math.round(att.durationSeconds / 3600 * 10) / 10} hrs`,
        'Late Arrival': att.isLate ? 'YES' : 'No',
        'Status': att.status
      }));
    }

    if (type === 'drowsiness') {
      const fatigueAlerts = alerts.filter(a => a.type === 'DROWSINESS');
      return fatigueAlerts.map(a => ({
        'Alert ID': a.id,
        'Employee ID': a.employeeId,
        'Employee Name': a.employeeName,
        'Timestamp': new Date(a.timestamp).toLocaleString(),
        'Severity': a.severity,
        'Trigger Reason': a.description,
        'XAI Evaluation': a.xaiSummary,
        'Status': a.status
      }));
    }

    if (type === 'inactivity') {
      const inactAlerts = alerts.filter(a => a.type === 'INACTIVITY' || a.type === 'ABSENCE' || a.type === 'POSTURE');
      return inactAlerts.map(a => ({
        'Alert ID': a.id,
        'Employee ID': a.employeeId,
        'Employee Name': a.employeeName,
        'Type': a.type,
        'Timestamp': new Date(a.timestamp).toLocaleString(),
        'Summary': a.description,
        'AI Diagnosis': a.xaiSummary,
        'Resolution Status': a.status
      }));
    }

    // Default: Employee-wise summary
    return filteredEmployees.map(emp => {
      const empAtt = attendance.find(a => a.employeeId === emp.id);
      const empAlerts = alerts.filter(a => a.employeeId === emp.id);
      return {
        'Employee ID': emp.id,
        'Name': emp.name,
        'Department': emp.department,
        'Designation': emp.designation,
        'Workstation': emp.workstation,
        'Attendance': empAtt ? empAtt.status : 'N/A',
        'Working Hours': empAtt ? `${Math.round(empAtt.durationSeconds / 3600 * 10) / 10} hrs` : '0 hrs',
        'Alert Count': empAlerts.length,
        'Productivity Score': `${Math.max(65, Math.round(92 - (empAlerts.length * 4)))}%`
      };
    });
  }

  exportCSV(data, filename) {
    if (!data || data.length === 0) {
      alert("No data records available to export.");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportPDF(reportType, data) {
    if (!data || data.length === 0) {
      alert("No data records available to print.");
      return;
    }

    const headers = Object.keys(data[0]);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Popup blocked. Please allow popups to generate the printable PDF report.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>WorkSense AI - Official Report</title>
        <style>
          body { font-family: -apple-system, sans-serif; margin: 40px; color: #111; }
          .report-header { border-bottom: 2px solid #0969da; padding-bottom: 15px; margin-bottom: 25px; }
          .report-header h1 { margin: 0; color: #0969da; font-size: 24px; }
          .meta { font-size: 13px; color: #555; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { background: #f0f4f8; text-align: left; padding: 10px; border: 1px solid #ddd; font-weight: 600; }
          td { padding: 8px 10px; border: 1px solid #ddd; }
          tr:nth-child(even) { background: #fafafa; }
          .footer { margin-top: 40px; font-size: 11px; color: #777; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>WorkSense AI – Executive Report</h1>
          <div class="meta">Report Category: ${reportType.toUpperCase()} | Generated: ${new Date().toLocaleString()} | System: WorkSense AI v2.0</div>
        </div>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data.map(row => `<tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
        <div class="footer">
          Generated automatically by WorkSense AI Enterprise Platform • Certified Audit & Compliance Document
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }
}

window.reportManager = new ReportManager();

