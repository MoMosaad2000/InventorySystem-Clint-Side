export default class Customer {
    constructor(id, name, contactInfo, stockOutVouchers) {
        this.id = id;
        this.name = name;
        this.contactInfo = contactInfo;
        this.stockOutVoucher = stockOutVouchers;
    }
    static fromJson(json) {
        return new Customer(json.id, json.name, json.contactInfo, json.stockOutVouchers)
    }

}