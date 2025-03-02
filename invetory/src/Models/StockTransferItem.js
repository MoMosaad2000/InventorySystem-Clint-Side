export default class StockTransferItem {
    constructor(id, stockTransferId, productId, product, unit, quantity, price) {
        this.id = id;
        this.stockTransferId = stockTransferId;
        this.productId = productId;
        this.product = product;
        this.unit = unit;
        this.quantity = quantity;
        this.price = price;
        this.totalCost = quantity * price;
    }
}
