// WorkSense AI - Activity Analytics & Visualization Engine

class AnalyticsEngine {
  constructor() {
    this.departmentStats = {
      Administration: { active: 94, inactive: 4, away: 2, score: 96 },
      Engineering: { active: 88, inactive: 8, away: 4, score: 89 },
      'Quality & Testing': { active: 85, inactive: 10, away: 5, score: 86 },
      Operations: { active: 82, inactive: 12, away: 6, score: 82 },
      'Product Design': { active: 91, inactive: 6, away: 3, score: 92 },
      'Customer Support': { active: 87, inactive: 9, away: 4, score: 88 },
      'Human Resources': { active: 93, inactive: 5, away: 2, score: 94 }
    };

    this.weeklyTrend = [
      { day: 'Mon', score: 84, activeHours: 7.2, breakHours: 0.8 },
      { day: 'Tue', score: 88, activeHours: 7.5, breakHours: 0.5 },
      { day: 'Wed', score: 82, activeHours: 6.9, breakHours: 1.1 },
      { day: 'Thu', score: 86, activeHours: 7.3, breakHours: 0.7 },
      { day: 'Fri', score: 89, activeHours: 7.6, breakHours: 0.4 }
    ];
  }

  getOverviewKPIs(liveDurationSec = 0, isWorking = true) {
    const employees = window.appState ? window.appState.employees : [];
    const attendance = window.appState ? window.appState.attendance : [];
    const alerts = window.appState ? window.appState.alerts : [];
    const cameras = window.appState ? window.appState.cameras : [];

    const totalStaff = employees.length || 8;
    const presentStaff = attendance.filter(a => a.status === 'Present').length;
    const attendanceRate = totalStaff > 0 ? Math.round((presentStaff / totalStaff) * 100) : 88;
    const unackAlerts = alerts.filter(a => a.status === 'Unacknowledged').length;
    const drowsinessEvents = alerts.filter(a => a.type === 'DROWSINESS').length;
    const activeWorkstations = cameras.length || 8;
    
    // Average productivity calculation
    const avgScore = 87; 

    return {
      totalStaff,
      presentStaff,
      attendanceRate,
      unackAlerts,
      drowsinessEvents,
      activeWorkstations,
      avgScore
    };
  }

  generateTimelineBlocks() {
    // 09:00 to 17:00 (8 hours represented in 30-minute slots)
    const slots = [
      { time: '09:00', type: 'active', label: 'Standup & Planning' },
      { time: '09:30', type: 'active', label: 'Deep Focus' },
      { time: '10:00', type: 'active', label: 'Coding / Tasks' },
      { time: '10:30', type: 'inactive', label: 'Team Collaboration' },
      { time: '11:00', type: 'active', label: 'Review' },
      { time: '11:30', type: 'active', label: 'Active Focus' },
      { time: '12:00', type: 'break', label: 'Lunch Break' },
      { time: '12:30', type: 'break', label: 'Lunch Break' },
      { time: '13:00', type: 'active', label: 'Afternoon Sprint' },
      { time: '13:30', type: 'active', label: 'Implementation' },
      { time: '14:00', type: 'inactive', label: 'Design Sync' },
      { time: '14:30', type: 'active', label: 'Testing' },
      { time: '15:00', type: 'active', label: 'Deep Focus' },
      { time: '15:30', type: 'break', label: 'Coffee Break' },
      { time: '16:00', type: 'active', label: 'Documentation' },
      { time: '16:30', type: 'active', label: 'Final Wrapup' }
    ];
    return slots;
  }
}

window.analyticsEngine = new AnalyticsEngine();

