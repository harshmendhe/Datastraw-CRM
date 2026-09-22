/**
 * Shared status and priority badge CSS class utilities.
 */

export function getStatusClass(status) {
  switch (status?.toLowerCase()) {
    case 'open':
      return 'status-open';
    case 'in progress':
      return 'status-in-progress';
    case 'closed':
      return 'status-closed';
    default:
      return 'status-open';
  }
}

export function getPriorityClass(priority) {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return 'priority-urgent';
    case 'high':
      return 'priority-high';
    case 'medium':
      return 'priority-medium';
    case 'low':
      return 'priority-low';
    default:
      return 'priority-medium';
  }
}
