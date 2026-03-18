
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export const useShiftReminder = (hasActiveShift: boolean, loginTime: Date | null) => {
  const [reminderShown, setReminderShown] = useState(false);

  useEffect(() => {
    if (!loginTime || hasActiveShift || reminderShown) return;

    const checkReminder = () => {
      const timeSinceLogin = Date.now() - loginTime.getTime();
      const twoMinutes = 2 * 60 * 1000;

      if (timeSinceLogin >= twoMinutes && !hasActiveShift && !reminderShown) {
        toast.info('Don\'t forget to start your shift!', {
          description: 'Click on the Shifts tab to begin your work session.',
          duration: 10000,
          action: {
            label: 'Start Shift',
            onClick: () => {
              // This will be handled by the parent component
              (window as any).navigateToShifts?.();
            }
          }
        });
        setReminderShown(true);
      }
    };

    const interval = setInterval(checkReminder, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [loginTime, hasActiveShift, reminderShown]);

  const resetReminder = () => setReminderShown(false);

  return { resetReminder };
};
