import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { Table, Button, Form } from "react-bootstrap";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const WarehouseReport = () => {
    const [startDate, setStartDate] = useState(new Date("2025-01-01"));
    const [endDate, setEndDate] = useState(new Date());
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
    const [products, setProducts] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totals, setTotals] = useState({ totalCost: 0 });
    const [selectedOperatingOrder, setSelectedOperatingOrder] = useState("");
    const [availableOperatingOrders, setAvailableOperatingOrders] = useState([]);

    useEffect(() => {
        axios.get(`${API_BASE_URL}Products`)
            .then(response => setProducts(response.data.$values || []))
            .catch(error => console.error("Error fetching products:", error));

        axios.get(`${API_BASE_URL}Warehouses`)
            .then(response => setWarehouses(response.data.$values || []))
            .catch(error => console.error("Error fetching warehouses:", error));
    }, []);

    const fetchWarehouseData = async () => {
        if (!selectedWarehouseId) return alert("اختر المخزن أولاً");

        try {
            setLoading(true);
            const formattedStartDate = startDate.toISOString().split('T')[0];
            const formattedEndDate = endDate.toISOString().split('T')[0];

            const [stockInRes, stockOutRes, transferRes, purchaseInvoicesRes] = await Promise.all([
                axios.get(`${API_BASE_URL}StockInVoucher`, { params: { startDate: formattedStartDate, endDate: formattedEndDate } }),
                axios.get(`${API_BASE_URL}StockOutVoucher`, { params: { startDate: formattedStartDate, endDate: formattedEndDate } }),
                axios.get(`${API_BASE_URL}StockTransfer`),
                axios.get(`${API_BASE_URL}PurchaseInvoice`)
            ]);

            const stockInData = stockInRes.data?.$values || [];
            const stockOutData = stockOutRes.data?.$values || [];
            const transfers = transferRes.data?.$values || [];
            const purchaseInvoices = purchaseInvoicesRes.data?.$values || [];

            const priceMap = new Map();
            purchaseInvoices.forEach(invoice => {
                invoice.items?.$values?.forEach(item => {
                    priceMap.set(item.productId, item.price);
                });
            });

            const allOperatingOrders = [
                ...stockInData.map(v => v.operatingOrder),
                ...stockOutData.map(v => v.operatingOrder),
                ...transfers.map(v => v.operatingOrder),
            ].filter(Boolean);

            const uniqueOrders = [...new Set(allOperatingOrders)];
            setAvailableOperatingOrders(uniqueOrders);

            const mapItems = (vouchers, type) => vouchers.flatMap(voucher =>
                voucher.items.$values
                    .filter(item => item.warehouseId === selectedWarehouseId)
                    .map(item => {
                        const product = products.find(p => p.id === item.productId) || {};
                        const unitPrice = priceMap.get(item.productId) || 0;
                        const quantityIn = type === "سند إضافة" ? item.quantity : 0;
                        const quantityOut = type === "سند صرف" ? item.quantity : 0;
                        const totalCost = (quantityIn || quantityOut) * unitPrice;

                        return {
                            id: voucher.id,
                            voucherType: type,
                            transferDate: voucher.transferDate,
                            productCode: product.code || "-",
                            productName: product.name || "-",
                            from: type === "سند إضافة" ? item.supplier?.name || "مورد" : item.warehouse?.name || "مخزن",
                            to: type === "سند صرف" ? item.customer?.name || "عميل" : item.warehouse?.name || "مخزن",
                            quantityIn,
                            quantityOut,
                            quantityTransfer: 0,
                            price: unitPrice,
                            totalCost: totalCost,
                            operatingOrder: voucher.operatingOrder || "-",
                        };
                    })
            );

            const transferItems = transfers.flatMap(transfer =>
                transfer.items.$values
                    .filter(item => item.warehouseId === selectedWarehouseId || transfer.toWarehouseId === selectedWarehouseId)
                    .map(item => {
                        const product = products.find(p => p.id === item.productId) || {};
                        const isFrom = transfer.fromWarehouseId === selectedWarehouseId;
                        const isTo = transfer.toWarehouseId === selectedWarehouseId;
                        const quantityTransfer = isFrom ? -item.quantity : isTo ? item.quantity : 0;
                        const unitPrice = priceMap.get(item.productId) || 0;

                        // ✅ إجمالي التكلفة بالسالب لو الكمية بالسالب
                        const totalCost = quantityTransfer * unitPrice;

                        return {
                            id: transfer.id,
                            voucherType: "تحويل مخزني",
                            transferDate: transfer.transferDate,
                            productCode: product.code || "-",
                            productName: product.name || "-",
                            from: warehouses.find(w => w.id === transfer.fromWarehouseId)?.name || "غير معروف",
                            to: warehouses.find(w => w.id === transfer.toWarehouseId)?.name || "غير معروف",
                            quantityOut: 0,
                            quantityIn: 0,
                            quantityTransfer,
                            price: unitPrice,
                            totalCost: totalCost,
                            operatingOrder: transfer.operatingOrder || "-",
                        };
                    })
            );

            let fullData = [
                ...mapItems(stockInData, "سند إضافة"),
                ...mapItems(stockOutData, "سند صرف"),
                ...transferItems
            ].filter(item =>
                new Date(item.transferDate) >= startDate && new Date(item.transferDate) <= endDate
            );

            if (selectedOperatingOrder) {
                fullData = fullData.filter(item => item.operatingOrder === selectedOperatingOrder);
            }

            fullData.sort((a, b) => new Date(a.transferDate) - new Date(b.transferDate));

            const totalCostSum = fullData.reduce((acc, item) => acc + item.totalCost, 0);
            setTotals({ totalCost: totalCostSum });
            setReportData(fullData);

        } catch (error) {
            console.error("Error fetching warehouse data:", error);
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <h2>تقرير المخزن</h2>
            <div className="row mb-3 align-items-end">
                <div className="col-md-3">
                    <label>من تاريخ:</label>
                    <DatePicker selected={startDate} onChange={setStartDate} className="form-control" dateFormat="yyyy-MM-dd" />
                </div>
                <div className="col-md-3">
                    <label>إلى تاريخ:</label>
                    <DatePicker selected={endDate} onChange={setEndDate} className="form-control" dateFormat="yyyy-MM-dd" />
                </div>
                <div className="col-md-3">
                    <label>اختر المخزن:</label>
                    <Form.Select value={selectedWarehouseId || ""} onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}>
                        <option value="">-- اختر --</option>
                        {warehouses.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </Form.Select>
                </div>
                <div className="col-md-3">
                    <label>أمر التشغيل:</label>
                    <Form.Select value={selectedOperatingOrder} onChange={(e) => setSelectedOperatingOrder(e.target.value)}>
                        <option value="">-- الكل --</option>
                        {availableOperatingOrders.map(order => (
                            <option key={order} value={order}>{order}</option>
                        ))}
                    </Form.Select>
                </div>
            </div>
            <div className="mb-3">
                <Button onClick={fetchWarehouseData}>عرض التقرير</Button>
            </div>

            {loading ? (
                <p>جاري تحميل البيانات...</p>
            ) : reportData.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>رقم السند</th>
                                <th>نوع السند</th>
                                <th>تاريخ السند</th>
                                <th>كود الصنف</th>
                                <th>اسم الصنف</th>
                                <th>من</th>
                                <th>إلى</th>
                                <th>كمية الإضافة</th>
                                <th>كمية الصرف</th>
                                <th>كمية التحويل</th>
                                <th>السعر</th>
                                <th>إجمالي التكلفة</th>
                                <th>أمر التشغيل</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((item, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{item.id}</td>
                                    <td>{item.voucherType}</td>
                                    <td>{new Date(item.transferDate).toLocaleDateString()}</td>
                                    <td>{item.productCode}</td>
                                    <td>{item.productName}</td>
                                    <td>{item.from}</td>
                                    <td>{item.to}</td>
                                    <td>{item.quantityIn}</td>
                                    <td>{item.quantityOut}</td>
                                    <td>{item.quantityTransfer}</td>
                                    <td>{item.price}</td>
                                    <td>{item.totalCost}</td>
                                    <td>{item.operatingOrder}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="12">الإجمالي</td>
                                <td>{totals.totalCost}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </Table>
                </div>
            ) : (
                <p>لا توجد بيانات لعرضها.</p>
            )}
        </div>
    );
};

export default WarehouseReport;
