// ✅ تم تعديل عرض الجدول ليملأ الشاشة بالكامل من اليمين للشمال مع ترك مسافة 1 سم على الجانبين
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axiosInstance from "../utils/axiosInstance";
import { Table, Button, Form } from "react-bootstrap";

//const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const InventoryReport = () => {
    const [startDate, setStartDate] = useState(new Date("2025-01-01"));
    const [endDate, setEndDate] = useState(new Date());
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
    const [reportData, setReportData] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedOperatingOrder, setSelectedOperatingOrder] = useState("");
    const [availableOperatingOrders, setAvailableOperatingOrders] = useState([]);

    useEffect(() => {
        axiosInstance.get(`Warehouses`).then(res => setWarehouses(res.data.$values || []));
        axiosInstance.get(`Products`).then(res => setProducts(res.data.$values || []));
    }, []);

    const fetchReport = async () => {
        if (!selectedWarehouseId) return alert("اختر المخزن أولاً");
        setLoading(true);

        try {
            const [stockInRes, stockOutRes, transferRes, purchaseInvoicesRes] = await Promise.all([
                axiosInstance.get(`StockInVoucher`),
                axiosInstance.get(`StockOutVoucher`),
                axiosInstance.get(`StockTransfer`),
                axiosInstance.get(`PurchaseInvoice`)
            ]);

            const stockInData = stockInRes.data?.$values || [];
            const stockOutData = stockOutRes.data?.$values || [];
            const transferData = transferRes.data?.$values || [];
            const purchaseInvoices = purchaseInvoicesRes.data?.$values || [];

            const priceMap = new Map();
            purchaseInvoices.forEach(invoice => {
                invoice.items?.$values?.forEach(item => {
                    priceMap.set(item.productId, item.price);
                });
            });

            const movementMap = new Map();
            const operatingOrdersSet = new Set();

            const initProduct = (productId, price) => {
                if (!movementMap.has(productId)) {
                    movementMap.set(productId, {
                        added: 0,
                        issued: 0,
                        transferredIn: 0,
                        transferredOut: 0,
                        openingBalance: 0,
                        operatingOrders: [],
                        price
                    });
                }
            };

            const updateBalance = (productId, type, quantity, isBeforeStart) => {
                const record = movementMap.get(productId);
                if (isBeforeStart) {
                    if (type === "in") record.openingBalance += quantity;
                    if (type === "out") record.openingBalance -= quantity;
                } else {
                    if (type === "in") record.added += quantity;
                    if (type === "out") record.issued += quantity;
                }
            };

            stockInData.forEach(v => {
                v.items.$values.forEach(item => {
                    if (item.warehouseId === selectedWarehouseId) {
                        const isBefore = new Date(v.transferDate) < startDate;
                        const price = priceMap.get(item.productId) || 0;
                        initProduct(item.productId, price);
                        updateBalance(item.productId, "in", item.quantity, isBefore);
                        if (!isBefore && v.operatingOrder) movementMap.get(item.productId).operatingOrders.push(v.operatingOrder);
                        if (!isBefore) operatingOrdersSet.add(v.operatingOrder);
                    }
                });
            });

            stockOutData.forEach(v => {
                v.items.$values.forEach(item => {
                    if (item.warehouseId === selectedWarehouseId) {
                        const isBefore = new Date(v.transferDate) < startDate;
                        const price = priceMap.get(item.productId) || 0;
                        initProduct(item.productId, price);
                        updateBalance(item.productId, "out", item.quantity, isBefore);
                        if (!isBefore && v.operatingOrder) movementMap.get(item.productId).operatingOrders.push(v.operatingOrder);
                        if (!isBefore) operatingOrdersSet.add(v.operatingOrder);
                    }
                });
            });

            transferData.forEach(t => {
                t.items.$values.forEach(item => {
                    const isBefore = new Date(t.transferDate) < startDate;
                    const price = priceMap.get(item.productId) || 0;
                    const isOut = t.fromWarehouseId === selectedWarehouseId;
                    const isIn = t.toWarehouseId === selectedWarehouseId;
                    initProduct(item.productId, price);
                    if (isOut) updateBalance(item.productId, "out", item.quantity, isBefore);
                    if (isIn) updateBalance(item.productId, "in", item.quantity, isBefore);
                    if (!isBefore && t.operatingOrder) movementMap.get(item.productId).operatingOrders.push(t.operatingOrder);
                    if (!isBefore) operatingOrdersSet.add(t.operatingOrder);
                });
            });

            setAvailableOperatingOrders(Array.from(operatingOrdersSet).filter(Boolean));

            const data = Array.from(movementMap.entries()).map(([productId, m]) => {
                const product = products.find(p => p.id === productId) || {};
                const matchesOrder = !selectedOperatingOrder || m.operatingOrders.includes(selectedOperatingOrder);
                if (!matchesOrder) return null;
                const closingBalance = m.openingBalance + m.added + m.transferredIn - (m.issued + m.transferredOut);
                return {
                    productCode: product.code || "-",
                    productName: product.name || "-",
                    unit: product.unit || "-",
                    openingBalance: m.openingBalance,
                    added: m.added,
                    issued: m.issued,
                    transferredIn: m.transferredIn,
                    transferredOut: m.transferredOut,
                    closingBalance,
                    price: m.price,
                    totalCost: closingBalance * m.price
                };
            }).filter(Boolean);

            setReportData(data);
        } catch (error) {
            console.error("Error fetching report:", error);
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    const totals = reportData.reduce((acc, item) => {
        acc.openingBalance += item.openingBalance;
        acc.added += item.added;
        acc.issued += item.issued;
        acc.transferredIn += item.transferredIn;
        acc.transferredOut += item.transferredOut;
        acc.closingBalance += item.closingBalance;
        acc.totalCost += item.totalCost;
        return acc;
    }, { openingBalance: 0, added: 0, issued: 0, transferredIn: 0, transferredOut: 0, closingBalance: 0, totalCost: 0 });

    return (
        <div style={{ width: "90vw", padding: 0, margin: 0 }}>
            <h2>تقرير جرد المخزن</h2>
            <div className="row mb-3">
                <div className="col-md-3">
                    <label>من تاريخ:</label>
                    <DatePicker selected={startDate} onChange={setStartDate} className="form-control" dateFormat="yyyy-MM-dd" />
                </div>
                <div className="col-md-3">
                    <label>إلى تاريخ:</label>
                    <DatePicker selected={endDate} onChange={setEndDate} className="form-control" dateFormat="yyyy-MM-dd" />
                </div>
               
            </div>
            <div className="row mb-3">
                <div className="col-md-3">
                    <label>اختر المخزن:</label>
                    <Form.Select value={selectedWarehouseId || ""} onChange={e => setSelectedWarehouseId(Number(e.target.value))}>
                        <option value="">-- اختر --</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </Form.Select>
                </div>
                <div className="col-md-3">
                    <label>أمر التشغيل:</label>
                    <Form.Select value={selectedOperatingOrder} onChange={e => setSelectedOperatingOrder(e.target.value)}>
                        <option value="">-- الكل --</option>
                        {availableOperatingOrders.map(order => (
                            <option key={order} value={order}>{order}</option>
                        ))}
                    </Form.Select>
                </div>
            </div>
            <Button onClick={fetchReport}>عرض التقرير</Button>

            {loading ? <p>جاري التحميل...</p> : (
                <div style={{ overflowX: "auto", marginTop: 20 }}>
                    <Table striped bordered hover className="w-100">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>كود الصنف</th>
                                <th>اسم الصنف</th>
                                <th>الوحدة</th>
                                <th>الرصيد أول</th>
                                <th>إضافة</th>
                                <th>صرف</th>
                                <th>تحويل وارد</th>
                                <th>تحويل صادر</th>
                                <th>الرصيد آخر</th>
                                <th>سعر الوحدة</th>
                                <th>إجمالي التكلفة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>{item.productCode}</td>
                                    <td>{item.productName}</td>
                                    <td>{item.unit}</td>
                                    <td>{item.openingBalance}</td>
                                    <td>{item.added}</td>
                                    <td>{item.issued}</td>
                                    <td>{item.transferredIn}</td>
                                    <td>{item.transferredOut}</td>
                                    <td>{item.closingBalance}</td>
                                    <td>{item.price}</td>
                                    <td>{item.totalCost.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="table-info fw-bold">
                                <td colSpan="4">الإجماليات</td>
                                <td>{totals.openingBalance}</td>
                                <td>{totals.added}</td>
                                <td>{totals.issued}</td>
                                <td>{totals.transferredIn}</td>
                                <td>{totals.transferredOut}</td>
                                <td>{totals.closingBalance}</td>
                                <td>-</td>
                                <td>{totals.totalCost.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </Table>
                </div>
            )}
        </div>
    );
};

export default InventoryReport;
