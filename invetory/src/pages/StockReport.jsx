import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axiosInstance from "../utils/axiosInstance";
import { Table, Form, Button } from "react-bootstrap";

//const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const StockReport = () => {
    const [startDate, setStartDate] = useState(new Date("2025-01-01"));
    const [endDate, setEndDate] = useState(new Date());
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    const [reportData, setReportData] = useState([]);
    const [totals, setTotals] = useState({ inQty: 0, inCost: 0, outQty: 0, outCost: 0 });
    const [loading, setLoading] = useState(false);
    const [initialBalance, setInitialBalance] = useState({ quantity: 0, cost: 0 });

    useEffect(() => {
        axiosInstance.get(`Products`).then(res => setProducts(res.data.$values || []));
        axiosInstance.get(`Categories`).then(res => setCategories(res.data.$values || []));
        axiosInstance.get(`SubCategories`).then(res => setSubCategories(res.data.$values || []));
    }, []);

    const fetchPurchasePrices = async () => {
        const res = await axiosInstance.get(`PurchaseInvoice`);
        const prices = {};

        res.data?.$values?.forEach(invoice => {
            invoice.items?.$values?.forEach(item => {
                if (!prices[item.productId]) {
                    prices[item.productId] = item.price;
                }
            });
        });

        return prices;
    };

    const fetchStockData = async () => {
        try {
            setLoading(true);
            const prices = await fetchPurchasePrices();

            const beginningOfYear = new Date(startDate.getFullYear(), 0, 1);
            const dayBeforeStart = new Date(startDate);
            dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);

            const formattedInitialStart = beginningOfYear.toISOString().split('T')[0];
            const formattedInitialEnd = dayBeforeStart.toISOString().split('T')[0];

            const [stockInBefore, stockOutBefore] = await Promise.all([
                axiosInstance.get(`StockInVoucher`, {
                    params: { startDate: formattedInitialStart, endDate: formattedInitialEnd }
                }),
                axiosInstance.get(`StockOutVoucher`, {
                    params: { startDate: formattedInitialStart, endDate: formattedInitialEnd }
                }),
            ]);
            const filterItems = item => {
                const product = products.find(p => p.id == item.productId);
                const matchesProduct = !selectedProduct || item.productId == selectedProduct;
                const matchesColor = !selectedColor || item.colorCode === selectedColor;
                const matchesSubCategory = !selectedSubCategory || product?.subCategoryId == selectedSubCategory;
                const matchesCategory = !selectedCategory || subCategories.find(sc => sc.id === product?.subCategoryId)?.categoryId == selectedCategory;
                return matchesProduct && matchesColor && matchesSubCategory && matchesCategory;
            };
            const mapItems = (data, type) => data?.$values.flatMap(voucher =>
                voucher.items?.$values
                    .filter(filterItems)
                    .map(item => {
                        const quantity = item.quantity ?? 0;
                        const unitPrice = prices[item.productId] ?? 0;
                        return {
                            id: voucher.id,
                            transferDate: voucher.transferDate,
                            voucherType: type,
                            from: type === "سند إضافة" ? item.supplier?.name || "غير متوفر" : item.warehouse?.name || "غير متوفر",
                            to: type === "سند صرف" ? item.customer?.name || "غير متوفر" : item.warehouse?.name || "غير متوفر",
                            quantity,
                            unitPrice,
                            operatingOrder: voucher.operatingOrder || "-"
                        };
                    })
            ) || [];

            const stockInBeforeData = mapItems(stockInBefore.data, "سند إضافة");
            const stockOutBeforeData = mapItems(stockOutBefore.data, "سند صرف");

            const allBeforeData = [...stockInBeforeData, ...stockOutBeforeData]
                .filter(item => new Date(item.transferDate) < startDate)
                .sort((a, b) => new Date(a.transferDate) - new Date(b.transferDate));

            let openingQty = 0;
            let fixedUnitPrice = prices[selectedProduct] ?? 0;

            allBeforeData.forEach(item => {
                if (item.voucherType === "سند إضافة") {
                    openingQty += item.quantity;
                } else if (item.voucherType === "سند صرف") {
                    openingQty -= item.quantity;
                }
            });

            const openingCost = openingQty * fixedUnitPrice;
            setInitialBalance({ quantity: openingQty, cost: openingCost });

            const formattedStartDate = startDate.toISOString().split('T')[0];
            const formattedEndDate = endDate.toISOString().split('T')[0];

            const [stockInResponse, stockOutResponse] = await Promise.all([
                axiosInstance.get(`StockInVoucher`, { params: { startDate: formattedStartDate, endDate: formattedEndDate } }),
                axiosInstance.get(`StockOutVoucher`, { params: { startDate: formattedStartDate, endDate: formattedEndDate } })
            ]);

            const stockInData = mapItems(stockInResponse.data, "سند إضافة");
            const stockOutData = mapItems(stockOutResponse.data, "سند صرف");

            const fullData = [...stockInData, ...stockOutData]
                .filter(item => new Date(item.transferDate) >= startDate && new Date(item.transferDate) <= endDate)
                .sort((a, b) => new Date(a.transferDate) - new Date(b.transferDate));

            let runningQuantity = openingQty;
            let runningCost = openingCost;
            let totalInQty = 0, totalInCost = 0, totalOutQty = 0, totalOutCost = 0;

            const dataWithBalance = fullData.map(item => {
                const actualCost = item.quantity * item.unitPrice;

                if (item.voucherType === "سند إضافة") {
                    runningQuantity += item.quantity;
                    runningCost += actualCost;
                    totalInQty += item.quantity;
                    totalInCost += actualCost;
                } else if (item.voucherType === "سند صرف") {
                    runningQuantity -= item.quantity;
                    runningCost -= actualCost;
                    totalOutQty += item.quantity;
                    totalOutCost += actualCost;
                }

                return {
                    ...item,
                    cost: actualCost,
                    balanceQuantity: runningQuantity,
                    balanceCost: runningCost
                };
            });

            setReportData(dataWithBalance);
            setTotals({ inQty: totalInQty, inCost: totalInCost, outQty: totalOutQty, outCost: totalOutCost });
        } catch (error) {
            console.error("Error fetching stock data:", error);
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ width: "90vw", padding: 0, margin: 0 }}>
            <h2>تقرير الصنف</h2>
            <div className="row mb-3 align-items-end">
                <div className="col-md-3">
                    <label>من تاريخ:</label>
                    <DatePicker selected={startDate} onChange={date => setStartDate(date)} className="form-control" dateFormat="yyyy-MM-dd" />
                </div>
                <div className="col-md-3">
                    <label>إلى تاريخ:</label>
                    <DatePicker selected={endDate} onChange={date => setEndDate(date)} className="form-control" dateFormat="yyyy-MM-dd" />
                </div>
                <div className="col-md-3">
                    <label>الصنف الرئيسي:</label>
                    <Form.Select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                        <option value="">-- اختر --</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </Form.Select>
                </div>
                <div className="col-md-3">
                    <label>الصنف الفرعي:</label>
                    <Form.Select value={selectedSubCategory} onChange={e => setSelectedSubCategory(e.target.value)}>
                        <option value="">-- اختر --</option>
                        {subCategories
                            .filter(sc => sc.categoryId == selectedCategory)
                            .map(sc => (
                                <option key={sc.id} value={sc.id}>{sc.name}</option>
                            ))}
                    </Form.Select>
                </div>
                <div className="col-md-3">
                    <label>الصنف:</label>
                    <Form.Select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="form-select">
                        <option value="">اختر الصنف</option>
                        {products.map(product => (
                            <option key={product.id} value={product.id}>{product.name} ({product.code})</option>
                        ))}
                    </Form.Select>
                </div>
                <div className="col-md-3">
                    <label>اللون:</label>
                    <Form.Select value={selectedColor} onChange={e => setSelectedColor(e.target.value)} className="form-select">
                        <option value="">كل الألوان</option>
                        {products
                            .filter(product => product.id == selectedProduct)
                            .map(product => (
                                <option key={product.id} value={product.colorCode}>
                                    {product.name} ({product.colorCode})
                                </option>
                            ))}
                    </Form.Select>
                </div>
            </div>
            <Button onClick={fetchStockData} className="mb-3">بحث</Button>

            {loading ? (
                <p>جاري تحميل البيانات...</p>
            ) : reportData.length > 0 ? (
                <>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>رقم السند</th>
                                <th>اسم السند</th>
                                <th>تاريخ السند</th>
                                <th>من</th>
                                <th>إلى</th>
                                <th>أمر التشغيل</th>
                                <th>سعر الوحدة</th>
                                <th colSpan="2">سند الإضافة</th>
                                <th colSpan="2">سند الصرف</th>
                                <th colSpan="2">الرصيد</th>
                            </tr>
                            <tr>
                                <th colSpan="8">الرصيد الافتتاحي</th>
                                <th colSpan="2">{initialBalance.quantity} / {initialBalance.cost}</th>
                                <th colSpan="2"></th>
                                <th colSpan="2"></th>
                            </tr>
                            <tr>
                                <th colSpan="8"></th>
                                <th>الكمية</th>
                                <th>التكلفة</th>
                                <th>الكمية</th>
                                <th>التكلفة</th>
                                <th>الكمية</th>
                                <th>التكلفة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((item, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{item.id}</td>
                                    <td>{item.voucherType}</td>
                                    <td>{new Date(item.transferDate).toLocaleDateString()}</td>
                                    <td>{item.from}</td>
                                    <td>{item.to}</td>
                                    <td>{item.operatingOrder}</td>
                                    <td>{item.unitPrice}</td>
                                    <td>{item.voucherType === "سند إضافة" ? item.quantity : "-"}</td>
                                    <td>{item.voucherType === "سند إضافة" ? item.cost : "-"}</td>
                                    <td>{item.voucherType === "سند صرف" ? item.quantity : "-"}</td>
                                    <td>{item.voucherType === "سند صرف" ? item.cost : "-"}</td>
                                    <td>{item.balanceQuantity}</td>
                                    <td>{item.balanceCost}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                                <tr className="table-info fw-bold">
                                <td colSpan="8">الإجمالي</td>
                                <td>{totals.inQty}</td>
                                <td>{totals.inCost}</td>
                                <td>{totals.outQty}</td>
                                <td>{totals.outCost}</td>
                                <td></td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </Table>
                </>
            ) : (
                <p>لا توجد بيانات لعرضها.</p>
            )}
        </div>
    );
};

export default StockReport;
