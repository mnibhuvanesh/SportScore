import { Request, Response } from 'express';
import { Notification } from '../models/Notification';

export class NotificationController {
  static async listNotifications(req: Request, res: Response): Promise<void> {
    try {
      const notifications = await Notification.find({ userId: req.user!._id })
        .sort({ createdAt: -1 })
        .limit(30);

      const unreadCount = await Notification.countDocuments({
        userId: req.user!._id,
        isRead: false,
      });

      res.status(200).json({ success: true, data: { notifications, unreadCount } });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list notifications' } });
    }
  }

  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await Notification.findOneAndUpdate({ _id: id, userId: req.user!._id }, { isRead: true });
      res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update notification' } });
    }
  }

  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      await Notification.updateMany({ userId: req.user!._id, isRead: false }, { isRead: true });
      res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update notifications' } });
    }
  }
}
