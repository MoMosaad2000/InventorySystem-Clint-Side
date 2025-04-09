export default class Product {
    constructor(id, name, code, description, quantity, purchasePrice, salePrice, colorCode, minSalePrice, imageUrl, subCategoryId, warehouseId, warehouse) {
        this.id = id || 0;
        this.name = name;
        this.code = code;
        this.description = description || "";
        this.quantity = quantity || 0;
        this.purchasePrice = purchasePrice || 0;
        this.salePrice = salePrice || 0;
        this.minSalePrice = minSalePrice || 0;
        this.imageUrl = imageUrl || "";
        this.subCategoryId = subCategoryId || 0;
        this.warehouseId = warehouseId || 0;
        this.colorCode = colorCode || ""; 
        this.warehouse = warehouse || { id: 0, name: "غير محدد" }; // تخزين `warehouse` ككائن يحتوي على `id` و `name`
    }
}
