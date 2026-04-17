// Helper function to check if an event is currently live (voting is ongoing)
export function isEventLive(event: {
  votingStartDate?: string | null
  votingEndDate?: string | null
}): boolean {
  const now = new Date()
  
  // Check if voting has started
  if (event.votingStartDate && new Date(event.votingStartDate) > now) {
    return false
  }
  
  // Check if voting has ended
  if (event.votingEndDate && new Date(event.votingEndDate) < now) {
    return false
  }
  
  return true
}
