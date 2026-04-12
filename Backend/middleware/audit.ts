import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';
import logger from '../config/logger';

interface AuditOptions {
  action: string;
  entityType: string;
  description: string | ((req: Request, res: Response) => string);
  entityId?: (req: Request) => string;
  entityName?: (req: Request, res: Response) => string;
  changes?: (req: Request) => any;
  severity?: 'info' | 'warning' | 'critical';
}

export const auditAction = (options: AuditOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = function(body: any) {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const user = req.user as any;
        if (user) {
          const logEntry = {
            userId: user._id,
            userName: user.name || user.email,
            userRole: user.role,
            action: options.action,
            entityType: options.entityType,
            entityId: options.entityId ? options.entityId(req) : (body?._id || req.params?.id),
            entityName: options.entityName ? options.entityName(req, res) : undefined,
            description: typeof options.description === 'function' 
              ? options.description(req, res) 
              : options.description,
            changes: options.changes ? options.changes(req) : null,
            severity: options.severity || 'info',
            ipAddress: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('User-Agent'),
          };

          AuditLog.create(logEntry).catch(err => {
            logger.error('Audit log creation failed', { error: err.message, action: options.action });
          });

          logger.info(`AUDIT: ${logEntry.action} by ${logEntry.userName} (${logEntry.userRole})`, {
            entityType: logEntry.entityType,
            entityId: logEntry.entityId,
          });
        }
      }

      return originalJson(body);
    };

    next();
  };
};

export const createAuditLog = async (
  user: any,
  action: string,
  entityType: string,
  description: string,
  extra?: {
    entityId?: string;
    entityName?: string;
    changes?: any;
    severity?: 'info' | 'warning' | 'critical';
    ipAddress?: string;
  }
) => {
  try {
    await AuditLog.create({
      userId: user._id,
      userName: user.name || user.email,
      userRole: user.role,
      action,
      entityType,
      description,
      entityId: extra?.entityId,
      entityName: extra?.entityName,
      changes: extra?.changes,
      severity: extra?.severity || 'info',
      ipAddress: extra?.ipAddress,
    });
  } catch (err: any) {
    logger.error('Audit log creation failed', { error: err.message, action });
  }
};

export const responseTimeTracker = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = `${req.method} ${req.originalUrl}`;
    
    if (duration > 1000) {
      logger.warn(`SLOW API: ${route} took ${duration}ms`, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
      });
    }
  });

  next();
};
