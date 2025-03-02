export default class Warehouse {
    constructor(id, name, stocks = []) {
        this.id = id;
        this.name = name;
        this.stocks = stocks;
    }

    static fromJson(json) {
        return new Warehouse(json.id, json.name, json.stocks || []);
    }
}
