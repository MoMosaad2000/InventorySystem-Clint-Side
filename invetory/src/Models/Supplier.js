export default class Supplier {
    constructor(id, name, contactInfo, stockInVochers) {
        this.id = id;
        this.name = name;
        this.contactInfo = contactInfo;
        this.stockInVochers = stockInVochers;

    }
    static fromJson(json) {
        return new Supplier(json.id, json.name, json.contactInfo, json.stockInVochers || []);
}

}