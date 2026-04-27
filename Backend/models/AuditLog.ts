import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userRole: { type: String, enum: ['superadmin', 'admin', 'employee', 'shopper'], required: true },

  action: { 
    type: String, 
    required: true, 
    enum: [
      'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE', 'STOCK_UPDATE', 'STOCK_SCAN',
      'ORDER_CREATE', 'ORDER_STATUS_UPDATE', 'ORDER_DELIVER', 'ORDER_CANCEL',
      'RETURN_REQUEST', 'RETURN_HANDLE',
      'USER_CREATE', 'USER_UPDATE', 'USER_DELETE',
      'AUTH_LOGIN', 'AUTH_LOGOUT', 'AUTH_REGISTER', 'GOOGLE_AUTH_LOGIN',
      'SHOP_CONFIG_UPDATE', 'RACK_CREATE', 'RACK_UPDATE', 'RACK_DELETE',
      'DOOR_CREATE', 'DOOR_UPDATE', 'DOOR_DELETE',
      'INVOICE_CREATE',
      'SYSTEM_ERROR'
    ]
  },

  entityType: { 
    type: String, 
    enum: ['Product', 'Order', 'User', 'Rack', 'Door', 'ShopConfig', 'Invoice', 'System'],
    required: true
  },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  entityName: { type: String }, // Human-readable name (e.g., product name, order ID)

  description: { type: String, required: true },
  changes: { 
    type: mongoose.Schema.Types.Mixed, // { field: { old: value, new: value } }
    default: null
  },

  ipAddress: { type: String },
  userAgent: { type: String },
  
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info'
  }
}, {
  timestamps: true,
});

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ severity: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
