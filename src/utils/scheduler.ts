import cron from 'node-cron';
import logger from '@/utils/logger';
import kidMonthlySpendingRepo from '@/modules/kid/kid-monthly-spending.repo';
import kidRepo from '@/modules/kid/kid.repo';
import notificationService from '@/utils/notification.service';

/**
 * Initialize scheduled tasks
 */
export const initScheduler = (): void => {
  // Reset monthly spending at midnight on the first day of each month
  cron.schedule('0 0 1 * *', async () => {
    try {
      logger.info('Running monthly spending reset task');

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // JavaScript months are 0-indexed

      // Reset all kid monthly spendings
      const count = await kidMonthlySpendingRepo.resetAllKidMonthlySpendings(
        year,
        month,
      );

      logger.info(`Reset monthly spending for ${count} kids`);

      // Send monthly reports to parents
      await sendMonthlyReports();
    } catch (error: any) {
      logger.error(`Error in monthly spending reset task: ${error.message}`);
    }
  });

  logger.info('Scheduler initialized');
};

/**
 * Send monthly spending reports to parents
 */
const sendMonthlyReports = async (): Promise<void> => {
  try {
    // Get previous month
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    // Get all kids with spending limits
    const kids = await kidRepo.findAllWithSpendingLimits();

    // Get monthly spending for each kid
    for (const kid of kids) {
      try {
        const spending = await kidMonthlySpendingRepo.getKidMonthlySpending(
          kid.id,
          prevYear,
          prevMonth,
        );

        const totalSpent = parseFloat(spending.spending_amount.toString());
        // Since we're filtering for kids with spending limits > 0, this should be safe
        const spendingLimit = parseFloat(
          (kid.monthly_spending_limit || 0).toString(),
        );
        const remainingBudget = spendingLimit - totalSpent;

        // Send notification to parent
        await notificationService.sendMonthlyReportNotification(
          kid.parent_id,
          kid.id,
          totalSpent,
          remainingBudget,
        );
      } catch (error: any) {
        logger.error(
          `Error sending monthly report for kid ${kid.id}: ${error.message}`,
        );
      }
    }

    logger.info(`Sent monthly reports for ${kids.length} kids`);
  } catch (error: any) {
    logger.error(`Error sending monthly reports: ${error.message}`);
  }
};

export default {
  initScheduler,
};
