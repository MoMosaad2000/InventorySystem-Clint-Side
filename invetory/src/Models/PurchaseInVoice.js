/* eslint-disable no-undef */
// ✅ موديل فاتورة المشتريات (PurchaseInvoice)
export default class PurchaseInvoice {
    constructor(id, supplierId, supplier, invoiceDate, notes, totalAmount, items = []) {
        this.id = id;
        this.supplierId = supplierId;
        this.supplier = supplier;
        this.invoiceDate = invoiceDate || new Date().toISOString();
        this.notes = notes;
        this.totalAmount = totalAmount;
        this.items = items;
    }

    static fromJson(json) {
        return new PurchaseInvoice(
            json.id,
            json.supplierId,
            json.supplier ? Supplier.fromJson(json.supplier) : null,
            json.invoiceDate,
            json.notes,
            json.totalAmount,
            json.items || []
        );
    }
}
