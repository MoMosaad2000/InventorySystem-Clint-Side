export default class StockTransfer {
    constructor(id, fromWarehouseId, toWarehouseId, transferDate, notes, items) {
        this.id = id;
        this.fromWarehouseId = fromWarehouseId;
        this.toWarehouseId = toWarehouseId;
        this.transferDate = transferDate || new Date().toISOString();
        this.notes = notes || "";
        this.items = items || [];
    }
}
