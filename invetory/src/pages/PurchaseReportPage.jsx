import { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

//const API_BASE_URL = "http://inventory2025.runasp.net/api";

function PurchaseReportPage() {
    const [startDate, setStartDate] = useState("2025-01-01");
    const [endDate, setEndDate] = useState("2025-04-30");
    const [reportData, setReportData] = useState([]);
    const [productsMap, setProductsMap] = useState({});

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await axiosInstance.get(`/Products`);
            const map = {};
            (response.data?.$values || []).forEach(prod => {
                map[prod.id] = prod;
            });
            setProductsMap(map);
        } catch (err) {
            console.error("Error fetching products", err);
        }
    };

    const fetchReport = async () => {
        try {
            const response = await axiosInstance.get(`/PurchaseInvoice`);
            const allInvoices = response.data?.$values || [];

            const filtered = allInvoices.filter(inv => {
                const date = new Date(inv.invoiceDate);
                return date >= new Date(startDate) && date <= new Date(endDate);
            });

            const rows = filtered.flatMap((inv, index) => {
                return inv.items?.$values?.map((item,) => {
                    const productInfo = productsMap[item.productId] || {};
                    return {
                        no: index + 1,
                        invoiceDate: inv.invoiceDate.split("T")[0],
                        invoiceNumber: inv.id,
                        supplierName: inv.supplier?.name,
                        productName: item.product?.name,
                        productCode: item.product?.code,
                        unit: productInfo.unit || item.product?.unit,
                        quantity: item.quantity,
                        price: item.price,
                        discount: item.discount,
                        tax: item.tax,
                        total: item.totalCost
                    };
                }) || [];
            });

            setReportData(rows);
        } catch (err) {
            console.error("Error fetching report", err);
        }
    };

    const totalSum = reportData.reduce((acc, item) => acc + item.total, 0).toFixed(2);
    const totalDiscount = reportData.reduce((acc, item) => acc + item.discount, 0).toFixed(2);
    const totalTax = reportData.reduce((acc, item) => acc + item.tax, 0).toFixed(2);

    return (
        <div className="container mt-4">
            <h3>تقرير مشتريات</h3>
            <div className="row mb-3">
                <div className="col">
                    <label>الفترة من:</label>
                    <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="col">
                    <label>الفترة إلى:</label>
                    <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <div className="col d-flex align-items-end">
                    <button className="btn btn-primary w-100" onClick={fetchReport}>عرض التقرير</button>
                </div>
            </div>

            <table className="table table-bordered table-striped text-center">
                <thead>
                    <tr>
                        <th>م</th>
                        <th>تاريخ فاتورة الشراء</th>
                        <th>رقم فاتورة الشراء</th>
                        <th>اسم المورد</th>
                        <th>اسم الصنف</th>
                        <th>كود الصنف</th>
                        <th>الوحدة</th>
                        <th>الكمية</th>
                        <th>السعر</th>
                        <th>الخصم</th>
                        <th>ضريبة القيمة المضافة</th>
                        <th>الإجمالي شامل الضريبة</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.map((row, i) => (
                        <tr key={i}>
                            <td>{i + 1}</td>
                            <td>{row.invoiceDate}</td>
                            <td>{row.invoiceNumber}</td>
                            <td>{row.supplierName}</td>
                            <td>{row.productName}</td>
                            <td>{row.productCode}</td>
                            <td>{row.unit}</td>
                            <td>{row.quantity}</td>
                            <td>{row.price}</td>
                            <td>{row.discount}</td>
                            <td>{row.tax}</td>
                            <td>{row.total}</td>
                        </tr>
                    ))}
                    <tr className="table-info fw-bold">
                        <td colSpan="9">الإجماليات</td>
                        <td>{totalDiscount}</td>
                        <td>{totalTax}</td>
                        <td>{totalSum}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default PurchaseReportPage;
