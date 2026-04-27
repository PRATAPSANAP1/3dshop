import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'employee', 'shopper'], default: 'shopper' },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
  employeePermissions: [{ 
    type: String, 
    enum: ['VIEW_ORDERS', 'UPDATE_DELIVERY_STATUS', 'USE_SCANNER', 'VIEW_PRODUCTS', 'VIEW_DASHBOARD_STATS', 'MANAGE_INVENTORY_STOCK'] 
  }],
  shopName: { type: String }, // Optional for regular customers
  mobile: { type: String },
  addresses: [{
    label: { type: String, default: 'Home' }, // Home, Work, etc
    fullName: { type: String },
    phone: { type: String },
    street: { type: String },
    landmark: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    isDefault: { type: Boolean, default: false }
  }],
  address: { type: String }, // Keep for backward compatibility
  isBlocked: { type: Boolean, default: false },
  token: { type: String, default: null }, // Access token footprint
  refreshToken: { type: String, default: null }, // Long-lived refresh token
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }
}, {
  timestamps: true
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error: any) {
    console.error('Password hash error:', error);
    throw error;
  }
});

userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;

