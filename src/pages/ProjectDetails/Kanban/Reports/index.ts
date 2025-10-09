// Kanban Reports Module
// This module provides comprehensive Kanban metrics and analytics

export { ReportsView } from './ReportsView'

// Report Types Available:
// 1. Overview - Total tasks, completion rate, throughput, WIP count
// 2. Flow Metrics - Flow efficiency, throughput, WIP analysis
// 3. Cycle/Lead Time - Cycle time, lead time, time efficiency
// 4. WIP Analysis - Current WIP, aging tasks, WIP health
// 5. Team Performance - Individual and team metrics

// All reports are integrated with API endpoints:
// - GET /api/v1/projects/{projectId}/kanban-reports/overview
// - GET /api/v1/projects/{projectId}/kanban-reports/flow-metrics
// - GET /api/v1/projects/{projectId}/kanban-reports/cycle-time
// - GET /api/v1/projects/{projectId}/kanban-reports/wip-analysis
// - GET /api/v1/projects/{projectId}/kanban-reports/team-performance
// - GET /api/v1/projects/{projectId}/kanban-reports/export
