import { DB } from '@/database';
import { KidMonthlySpending } from '@/interfaces';
import { CustomError } from '@/utils/custom-error';

/**
 * Get monthly spending for a kid
 * @param {string} kidId - Kid ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Promise<KidMonthlySpending>} Monthly spending record
 */
export const getKidMonthlySpending = async (
  kidId: string,
  year: number,
  month: number,
): Promise<KidMonthlySpending> => {
  try {
    let spending = await DB.KidMonthlySpendings.findOne({
      where: {
        kid_id: kidId,
        year,
        month,
      },
    });

    if (!spending) {
      // Create a new record if it doesn't exist
      spending = await DB.KidMonthlySpendings.create({
        kid_id: kidId,
        year,
        month,
        spending_amount: 0,
      });
    }

    return spending;
  } catch (error) {
    throw new CustomError(
      `Error getting monthly spending for kid: ${error.message}`,
      500,
    );
  }
};

/**
 * Update monthly spending for a kid
 * @param {string} kidId - Kid ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @param {number} amount - Amount to add to current spending
 * @returns {Promise<KidMonthlySpending>} Updated monthly spending record
 */
export const updateKidMonthlySpending = async (
  kidId: string,
  year: number,
  month: number,
  amount: number,
): Promise<KidMonthlySpending> => {
  try {
    const spending = await getKidMonthlySpending(kidId, year, month);

    // Update the spending amount
    const newAmount = parseFloat(spending.spending_amount.toString()) + amount;

    await spending.update({
      spending_amount: newAmount,
    });

    return spending;
  } catch (error) {
    throw new CustomError(
      `Error updating monthly spending for kid: ${error.message}`,
      500,
    );
  }
};

/**
 * Get all monthly spending records for a kid
 * @param {string} kidId - Kid ID
 * @returns {Promise<KidMonthlySpending[]>} Monthly spending records
 */
export const getAllKidMonthlySpendings = async (
  kidId: string,
): Promise<KidMonthlySpending[]> => {
  try {
    return await DB.KidMonthlySpendings.findAll({
      where: {
        kid_id: kidId,
      },
      order: [
        ['year', 'DESC'],
        ['month', 'DESC'],
      ],
    });
  } catch (error) {
    throw new CustomError(
      `Error getting all monthly spendings for kid: ${error.message}`,
      500,
    );
  }
};

/**
 * Reset monthly spending for all kids (typically run at the beginning of a new month)
 * @param {number} year - Year to create records for
 * @param {number} month - Month to create records for (1-12)
 * @returns {Promise<number>} Number of records created
 */
export const resetAllKidMonthlySpendings = async (
  year: number,
  month: number,
): Promise<number> => {
  try {
    // Get all active kids
    const kids = await DB.Kids.findAll({
      where: {
        is_active: true,
      },
    });

    // Create new spending records for each kid
    const promises = kids.map(kid =>
      getKidMonthlySpending(kid.id, year, month),
    );

    const results = await Promise.all(promises);
    return results.length;
  } catch (error) {
    throw new CustomError(
      `Error resetting monthly spendings: ${error.message}`,
      500,
    );
  }
};

export default {
  getKidMonthlySpending,
  updateKidMonthlySpending,
  getAllKidMonthlySpendings,
  resetAllKidMonthlySpendings,
};
