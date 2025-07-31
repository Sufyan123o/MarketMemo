/**
 * Simple market hours checker
 */
export const isMarketOpen = () => {
  const now = new Date();
  const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const est = new Date(utc.getTime() - 5 * 3600000); // EST/EDT
  
  const day = est.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = est.getHours();
  const minute = est.getMinutes();
  const time = hour + minute / 60;
  
  // Check if it's a weekday (Monday-Friday)
  const isWeekday = day >= 1 && day <= 5;
  
  // Regular market hours: 9:30 AM to 4:00 PM EST
  const isRegularHours = time >= 9.5 && time < 16;
  
  // Extended hours: 4:00 AM to 8:00 PM EST
  const isExtendedHours = time >= 4 && time < 20;
  
  return {
    isWeekday,
    isRegularHours: isWeekday && isRegularHours,
    isExtendedHours: isWeekday && isExtendedHours,
    currentTime: est.toLocaleString('en-US', { timeZone: 'America/New_York' }),
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
  };
};

// Log market status
const marketStatus = isMarketOpen();
console.log('🏛️ Market Status:', {
  ...marketStatus,
  status: marketStatus.isRegularHours 
    ? 'OPEN (Regular)' 
    : marketStatus.isExtendedHours 
    ? 'OPEN (Extended)' 
    : 'CLOSED'
});

export default isMarketOpen;
