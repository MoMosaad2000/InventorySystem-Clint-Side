import Customer from "./Customer";

export default class StockInVoucher {
    constructor(id, customerId, customer, transferDate, notes, items = []) {
        this.id = id;
        this.customerId = customerId;
        this.customer = customer;
        this.transferDate = transferDate || new Date().toISOString();
        this.notes = notes;
        this.items = items;

    }
    static fromJson(json) {
        return new StockInVoucher
            (json.id,
                json.customer ? Customer.fromJson(json.customer) : null,
                json.customerId,
                json.transferDate,
                json.notes,
                json.items || []);
    }
}