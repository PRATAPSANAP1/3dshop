const fs = require('fs');
const path = require('path');

const modelsDir = 'e:/app1/appv2/Backend/models';
const modelsToUpdate = [
  'AuditLog.ts', 'Cart.ts', 'Coupon.ts', 'Door.ts', 'Godown.ts', 'GodownRack.ts', 'GodownStock.ts', 
  'Invoice.ts', 'Notification.ts', 'Order.ts', 'Product.ts', 'Rack.ts', 'Review.ts', 
  'ShopConfig.ts', 'StockTransfer.ts', 'Wishlist.ts'
];

modelsToUpdate.forEach(file => {
  const filePath = path.join(modelsDir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('shopId: {')) {
    content = content.replace(/new mongoose\.Schema(?:<any>)?\(\s*\{/, "new mongoose.Schema({\n  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },");
    
    // Also add compound index if possible, assuming mongoose is imported, we can do it later in the migration or cleanly.
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
