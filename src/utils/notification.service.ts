import { CustomError } from '@/utils/custom-error';
import logger from '@/utils/logger';
import {
  EMAIL_FROM,
  EMAIL_SERVICE,
  EMAIL_USER,
  EMAIL_PASSWORD,
  SMS_API_KEY,
  SMS_API_SECRET,
  SMS_FROM_NUMBER,
} from '@/config';
import nodemailer from 'nodemailer';
import userRepo from '@/modules/user/user.repo';
import kidRepo from '@/modules/kid/kid.repo';

/**
 * Notification types
 */
export enum NotificationType {
  LOW_BALANCE = 'low_balance',
  ORDER_PLACED = 'order_placed',
  LIMIT_REACHED = 'limit_reached',
  MONTHLY_REPORT = 'monthly_report',
}

/**
 * Notification channels
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
}

/**
 * Notification data interface
 */
interface NotificationData {
  [key: string]: any;
}

/**
 * Formatted notification
 */
interface FormattedNotification {
  subject: string;
  body: string;
}

/**
 * Format notification based on type and data
 * @param {NotificationType} type - Notification type
 * @param {NotificationData} data - Notification data
 * @returns {FormattedNotification} Formatted notification
 */
const formatNotification = (
  type: NotificationType,
  data: NotificationData,
): FormattedNotification => {
  switch (type) {
    case NotificationType.LOW_BALANCE:
      return {
        subject: 'Low Balance Alert',
        body: `Your child ${data.kidName} has a low balance of ${data.remainingBudget} for this month. Please consider adding more funds.`,
      };
    case NotificationType.ORDER_PLACED:
      return {
        subject: 'Order Placed',
        body: `Your child ${data.kidName} has placed an order for ${data.orderAmount}. Remaining budget: ${data.remainingBudget}.`,
      };
    case NotificationType.LIMIT_REACHED:
      return {
        subject: 'Spending Limit Reached',
        body: `Your child ${data.kidName} has reached their monthly spending limit of ${data.spendingLimit}.`,
      };
    case NotificationType.MONTHLY_REPORT:
      return {
        subject: 'Monthly Spending Report',
        body: `Monthly spending report for ${data.kidName}: Total spent: ${data.totalSpent}, Remaining budget: ${data.remainingBudget}.`,
      };
    default:
      return {
        subject: 'Notification',
        body: 'You have a new notification.',
      };
  }
};

/**
 * Send email notification
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @returns {Promise<boolean>} Success status
 */
const sendEmail = async (
  to: string,
  subject: string,
  body: string,
): Promise<boolean> => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: EMAIL_SERVICE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text: body,
      html: `<p>${body}</p>`,
    });

    logger.info(`Email sent: ${info.messageId}`);
    return true;
  } catch (error: any) {
    logger.error(`Error sending email: ${error.message}`);
    return false;
  }
};

/**
 * Send SMS notification
 * @param {string} to - Recipient phone number
 * @param {string} body - SMS body
 * @returns {Promise<boolean>} Success status
 */
const sendSMS = async (to: string, body: string): Promise<boolean> => {
  try {
    // This is a placeholder for an actual SMS API integration
    // In a real implementation, you would use a service like Twilio, Nexmo, etc.
    logger.info(`SMS would be sent to ${to}: ${body}`);

    // Example with Twilio (commented out)
    /*
    const client = require('twilio')(
      SMS_API_KEY,
      SMS_API_SECRET
    );
    await client.messages.create({
      body,
      from: SMS_FROM_NUMBER,
      to,
    });
    */

    return true;
  } catch (error: any) {
    logger.error(`Error sending SMS: ${error.message}`);
    return false;
  }
};

/**
 * Send notification to user
 * @param {string} userId - User ID
 * @param {NotificationType} type - Notification type
 * @param {NotificationData} data - Notification data
 * @param {NotificationChannel} channel - Notification channel
 * @returns {Promise<boolean>} Success status
 */
export const sendNotification = async (
  userId: string,
  type: NotificationType,
  data: NotificationData,
  channel: NotificationChannel = NotificationChannel.EMAIL,
): Promise<boolean> => {
  try {
    // Get user
    const user = await userRepo.findByPk(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Format notification
    const notification = formatNotification(type, data);

    // Send through appropriate channel
    switch (channel) {
      case NotificationChannel.EMAIL:
        return await sendEmail(
          user.email,
          notification.subject,
          notification.body,
        );
      case NotificationChannel.SMS:
        if (!user.phone) {
          logger.warn(`Cannot send SMS to user ${userId}: No phone number`);
          return false;
        }
        return await sendSMS(user.phone, notification.body);
      default:
        return false;
    }
  } catch (error: any) {
    logger.error(`Error sending notification: ${error.message}`);
    return false;
  }
};

/**
 * Send low balance notification
 * @param {string} parentId - Parent ID
 * @param {string} kidId - Kid ID
 * @param {number} remainingBudget - Remaining budget
 * @returns {Promise<boolean>} Success status
 */
export const sendLowBalanceNotification = async (
  parentId: string,
  kidId: string,
  remainingBudget: number,
): Promise<boolean> => {
  try {
    const kid = await kidRepo.findById(kidId);
    if (!kid) {
      throw new CustomError('Kid not found', 404);
    }

    return await sendNotification(parentId, NotificationType.LOW_BALANCE, {
      kidName: kid.name,
      remainingBudget,
    });
  } catch (error: any) {
    logger.error(`Error sending low balance notification: ${error.message}`);
    return false;
  }
};

/**
 * Send order placed notification
 * @param {string} parentId - Parent ID
 * @param {string} kidId - Kid ID
 * @param {number} orderAmount - Order amount
 * @param {number} remainingBudget - Remaining budget
 * @returns {Promise<boolean>} Success status
 */
export const sendOrderPlacedNotification = async (
  parentId: string,
  kidId: string,
  orderAmount: number,
  remainingBudget: number,
): Promise<boolean> => {
  try {
    const kid = await kidRepo.findById(kidId);
    if (!kid) {
      throw new CustomError('Kid not found', 404);
    }

    return await sendNotification(parentId, NotificationType.ORDER_PLACED, {
      kidName: kid.name,
      orderAmount,
      remainingBudget,
    });
  } catch (error: any) {
    logger.error(`Error sending order placed notification: ${error.message}`);
    return false;
  }
};

/**
 * Send limit reached notification
 * @param {string} parentId - Parent ID
 * @param {string} kidId - Kid ID
 * @param {number} spendingLimit - Spending limit
 * @returns {Promise<boolean>} Success status
 */
export const sendLimitReachedNotification = async (
  parentId: string,
  kidId: string,
  spendingLimit: number,
): Promise<boolean> => {
  try {
    const kid = await kidRepo.findById(kidId);
    if (!kid) {
      throw new CustomError('Kid not found', 404);
    }

    return await sendNotification(parentId, NotificationType.LIMIT_REACHED, {
      kidName: kid.name,
      spendingLimit,
    });
  } catch (error: any) {
    logger.error(`Error sending limit reached notification: ${error.message}`);
    return false;
  }
};

/**
 * Send monthly report notification
 * @param {string} parentId - Parent ID
 * @param {string} kidId - Kid ID
 * @param {number} totalSpent - Total spent
 * @param {number} remainingBudget - Remaining budget
 * @returns {Promise<boolean>} Success status
 */
export const sendMonthlyReportNotification = async (
  parentId: string,
  kidId: string,
  totalSpent: number,
  remainingBudget: number,
): Promise<boolean> => {
  try {
    const kid = await kidRepo.findById(kidId);
    if (!kid) {
      throw new CustomError('Kid not found', 404);
    }

    return await sendNotification(parentId, NotificationType.MONTHLY_REPORT, {
      kidName: kid.name,
      totalSpent,
      remainingBudget,
    });
  } catch (error: any) {
    logger.error(`Error sending monthly report notification: ${error.message}`);
    return false;
  }
};

export default {
  sendNotification,
  sendLowBalanceNotification,
  sendOrderPlacedNotification,
  sendLimitReachedNotification,
  sendMonthlyReportNotification,
};
