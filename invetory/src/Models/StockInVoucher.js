import Supplier from "./Supplier";

export default class StockInVoucher {
    constructor(id, supplierId, supplier, transferDate, notes, items = []) {
        this.id = id;
        this.supplierId = supplierId;
        this.supplier = supplier;
        this.transferDate = transferDate || new Date().toISOString();
        this.notes = notes;
        this.items = items;

    }
    static fromJson(json) {
        return new StockInVoucher
            (json.id,
                json.supplier ? Supplier.fromJson(json.supplier) : null,
                json.supplierId,
                json.transferDate,
                json.notes,
                json.items || []);
    }
}