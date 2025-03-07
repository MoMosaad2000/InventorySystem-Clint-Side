﻿import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://inventory2025.runasp.net/api/";


function StockInVoucherPage() {
    const [suppliers, setSuppliers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [products, setProducts] = useState([]);

    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [selectedWarehouse, setSelectedWarehouse] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [selectedProduct, setSelectedProduct] = useState("");
    const [warehouseKeeperName, setWarehouseKeeperName] = useState("");
    const [quantity, setQuantity] = useState(0);
    const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
    const [items, setItems] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [stockInVouchers, setStockInVoucher] = useState([]);
    const [stockInVoucherId, setStockInVoucherId] = useState("");
    const [nextVoucherId, setNextVoucherId] = useState(1);
    const [showTable, setShowTable] = useState(false);

    useEffect(() => {
        fetchSuppliers();
        fetchWarehouses();
        fetchCategories();
        fetchProducts();
        fetchNextVoucherId();
        fetchStockInVoucher();
    }, []);

    useEffect(() => {
        console.log("🔍 بعد تحميل السندات:", stockInVouchers);
    }, [stockInVouchers]);

    const fetchStockInVoucher = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}StockInVoucher`);
            console.log("📌 السندات المحفوظة في الـ API:", response.data?.$values);
            setStockInVoucher(response.data?.$values || []);
        } catch (error) {
            console.error("Error fetching stock transfers:", error);
        }
    };

    const fetchNextVoucherId = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}StockInVoucher/next-id`);
            setNextVoucherId(response.data);
        } catch (error) {
            console.error("Error fetching next voucher ID:", error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}Suppliers`);
            setSuppliers(response.data?.$values || []);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}warehouses`);
            setWarehouses(response.data?.$values || []);
        } catch (error) {
            console.error("Error fetching warehouses:", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}categories`);
            setCategories(response.data?.$values || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchSubCategories = async (categoryId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}subcategories`);
            const filteredSubCategories =
                response.data?.$values.filter(
                    (sc) => sc.categoryId === parseInt(categoryId)
                ) || [];
            setSubCategories(filteredSubCategories);
        } catch (error) {
            console.error("Error fetching subcategories:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}products`);
            setProducts(response.data?.$values || []);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };
    const handlePreview = async () => {
        try {
            // جلب فواتير الشراء لتعيين أسعار المنتجات
            const selectedInvoice = await axios.get(`${API_BASE_URL}PurchaseInvoice`);
            const productPriceMap = {};
            selectedInvoice.data?.$values?.forEach((invoice) => {
                invoice.items?.$values?.forEach((item) => {
                    productPriceMap[item.productId] = item.price;
                });
            });

            // جلب سندات إضافة المخزون
            const response = await axios.get(`${API_BASE_URL}StockInVoucher`);
            const allStockInVouchers = response.data?.$values || [];

            if (allStockInVouchers.length === 0) {
                alert("⚠️ لا يوجد بيانات متاحة للعرض!");
                setTableData([]);
                return;
            }

            const tableRows = allStockInVouchers.flatMap((voucher) =>
                (voucher.items?.$values || []).map((item, index) => ({
                    // نستخدم معرّف العنصر الفريد إذا وُجد، وإلا ندمج معرّف السند مع رقم الفهرس
                    id: item.id || `${voucher.id}-${index}`,
                    voucherId: voucher.id,
                    // نستخدم بيانات المورد من كل بند
                    supplier: item?.supplier?.name ?? "غير محدد",
                    // استخدام item.warehouseId مباشرة للعثور على اسم المستودع الصحيح
                    toWarehouse: warehouses.find((w) => w.id === item.warehouseId)?.name || "غير محدد",
                    product: item?.product?.name ?? "غير محدد",
                    code: item?.product?.code ?? "غير متوفر",
                    unit: item?.unit ?? item?.product?.unit ?? "غير متوفر",
                    quantity: item.quantity ?? 0,
                    price: productPriceMap[item.productId] ?? 0,
                    totalCost: item.quantity * (productPriceMap[item.productId] ?? 0)
                }))
            );

            if (tableRows.length === 0) {
                alert("⚠️ جميع السندات لا تحتوي على أي منتجات!");
                setTableData([]);
                return;
            }

            setTableData(tableRows);
            setShowTable(true);
        } catch (error) {
            console.error("Error fetching stock in vouchers:", error);
            alert("فشل في تحميل البيانات!");
            setTableData([]);
        }
    };

    // عند الضغط على زر "إضافة المنتج" نقوم بالتقاط بيانات الصنف والمورد والمستودع والكمية
    const handleAddItem = () => {
        if (!selectedProduct || !selectedSupplier || !selectedWarehouse || quantity <= 0) {
            alert("⚠️ رجاءً قم بتحديد الصنف والمورد والمستودع وأدخل كمية أكبر من 0.");
            return;
        }

        const product = products.find(
            (p) => p.id.toString() === selectedProduct.toString()
        );
        const supplier = suppliers.find(
            (s) => s.id.toString() === selectedSupplier.toString()
        );
        const warehouse = warehouses.find(
            (w) => w.id.toString() === selectedWarehouse.toString()
        );
        const productPrice = product?.price || 0;
        const totalCost = Number(quantity) * productPrice;

        const newItem = {
            productId: selectedProduct,
            supplierId: selectedSupplier,
            warehouseId: selectedWarehouse,
            quantity: Number(quantity),
            price: productPrice,
            totalCost: totalCost,
            productName: product ? product.name : "",
            supplier: supplier ? supplier.name : "",
            toWarehouse: warehouse ? warehouse.name : "",
            unit: product ? product.unit : ""
        };

        setItems([...items, newItem]);

        // إعادة ضبط القيم بعد الإضافة
        setSelectedProduct("");
        setSelectedSupplier("");
        setSelectedWarehouse("");
        setQuantity(0);
    };

    const handleStockIn = async () => {
        if (items.length === 0) {
            alert("⚠️ يجب إضافة منتجات إلى السند!");
            return;
        }

        try {
            const stockInData = {
                transferDate: new Date().toISOString(),
                warehouseKeeperName: warehouseKeeperName || "غير محدد",
                notes: "إضافة منتجات متعددة",
                items: items.map((item) => ({
                    productId: parseInt(item.productId),
                    supplierId: parseInt(item.supplierId),
                    warehouseId: parseInt(item.warehouseId),
                    quantity: item.quantity,

                    price: item.price,
                    tax: 0,
                    discount: 0
                }))
            };

            console.log("🔍 البيانات المرسلة:", JSON.stringify(stockInData, null, 2));
            const response = await axios.post(
                `${API_BASE_URL}StockInVoucher`,
                stockInData
            );

            if (response.status === 201) {
                alert("✅ تم إضافة المخزون بنجاح!");
                setItems([]);
            } else {
                throw new Error("❌ حدث خطأ أثناء إضافة المخزون!");
            }
        } catch (error) {
            console.error(
                "❌ خطأ أثناء إضافة المخزون:",
                error.response ? error.response.data : error
            );
            alert("❌ حدث خطأ أثناء إضافة المخزون!");
        }
    };

    const handleSearch = async () => {
        if (!stockInVoucherId) {
            alert("⚠️ يجب إدخال رقم السند!");
            return;
        }

        // جلب أسعار المنتجات من فواتير الشراء
        const selectedInvoice = await axios.get(`${API_BASE_URL}PurchaseInvoice`);
        const productPriceMap = {};
        selectedInvoice.data?.$values.forEach((invoice) => {
            invoice.items?.$values.forEach((item) => {
                productPriceMap[item.productId] = item.price;
            });
        });

        try {
            const response = await axios
                .get(`${API_BASE_URL}StockInVoucher/${stockInVoucherId}`)
                .catch((error) => {
                    console.error("Error fetching stock in voucher by ID:", error);
                    alert("فشل في البحث عن السند. تأكد من صحة رقم السند.");
                    return null;
                });

            if (!response || response.status !== 200) {
                alert("⚠️ لم يتم العثور على السند!");
                setTableData([]);
                return;
            }

            const voucher = response.data;

            if (!voucher.items || voucher.items.$values.length === 0) {
                alert("⚠️ السند موجود ولكن لا يحتوي على أي منتجات!");
                setTableData([]);
                return;
            }

            const tableRows = voucher.items.$values.map((item) => ({
                id: item.id,
                voucherId: voucher.id,
                supplier: item?.supplier?.name ?? "غير محدد",
                toWarehouse: warehouses.find((w) => w.id === item.warehouseId)?.name || "غير محدد",
                product: item?.product?.name ?? "غير محدد",
                code: item?.product?.code ?? "غير متوفر",
                unit: item?.unit ?? item?.product?.unit ?? "غير متوفر",
                quantity: item.quantity,
                price: productPriceMap[item.productId] ?? 0,
                totalCost: item.quantity * (productPriceMap[item.productId] ?? 0)
            }));

            setTableData(tableRows);
            setShowTable(true);
        } catch (error) {
            console.error("Error fetching stock in voucher by ID:", error);
            alert("فشل في البحث عن السند.");
            setTableData([]);
        }
    };


    return (
        <div className="container mt-4">
            <h2>سند إضافة مخزني</h2>
            <div className="row">
                <div className="row">
                    <div className="col">
                        <label>رقم السند:</label>
                        <input
                            type="text"
                            className="form-control mb-2"
                            value={nextVoucherId}
                            readOnly
                        />
                    </div>
                    <div className="col">
                        <label>تاريخ السند:</label>
                        <input
                            type="date"
                            className="form-control mb-2"
                            value={transferDate}
                            onChange={(e) => setTransferDate(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col">
                    <label>المورد:</label>
                    <select
                        className="form-select mb-2"
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                    >
                        <option value="">اختر المورد</option>
                        {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                                {supplier.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col">
                    <label>إلى المستودع:</label>
                    <select
                        className="form-select mb-2"
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                    >
                        <option value="">اختر المستودع</option>
                        {warehouses.map((warehouse) => (
                            <option key={warehouse.id} value={warehouse.id}>
                                {warehouse.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="row">
                <div className="row">
                    <div className="form-group">
                        <label>اسم أمين المستودع:</label>
                        <input
                            type="text"
                            className="form-control"
                            value={warehouseKeeperName || ""}
                            onChange={(e) => setWarehouseKeeperName(e.target.value || "")}
                        />
                    </div>
                    <div className="col">
                        <label>التوقيع:</label>
                        <input
                            type="text"
                            className="form-control mb-2"
                            placeholder="توقيع"
                        />
                    </div>
                </div>
                <div className="row">
                    <div className="col">
                        <label>المستلم:</label>
                        <input
                            type="text"
                            className="form-control mb-2"
                            placeholder="يوقع عند الاستلام"
                        />
                    </div>
                </div>
                <div className="col">
                    <label>التصنيف الرئيسي:</label>
                    <select
                        className="form-select mb-2"
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            fetchSubCategories(e.target.value);
                        }}
                    >
                        <option value="">اختر التصنيف</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col">
                    <label>التصنيف الفرعي:</label>
                    <select
                        className="form-select mb-2"
                        value={selectedSubCategory}
                        onChange={(e) => setSelectedSubCategory(e.target.value)}
                    >
                        <option value="">اختر التصنيف الفرعي</option>
                        {subCategories.map((subCategory) => (
                            <option key={subCategory.id} value={subCategory.id}>
                                {subCategory.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col">
                    <label>الصنف:</label>
                    <select
                        className="form-select mb-2"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                    >
                        <option value="">اختر الصنف</option>
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name} ({product.code})
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <label>الكمية:</label>
                    <input
                        type="number"
                        className="form-control"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />
                </div>
            </div>
            <button className="btn btn-success mt-3" onClick={handleAddItem}>
                إضافة المنتج
            </button>

            {/* جدول عرض العناصر المُضافة */}
            <div className="mt-4">
                <h4>قائمة المنتجات</h4>
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>الصنف</th>
                            <th>المورد</th>
                            <th>إلى مستودع</th>
                            <th>الكمية</th>
                            <th>إجمالي التكلفة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td>{item.productName}</td>
                                <td>{item.supplier}</td>
                                <td>{item.toWarehouse}</td>
                                <td>{item.quantity}</td>
                                <td>{item.totalCost}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <button className="btn btn-primary" onClick={handlePreview}>
                معاينة
            </button>
            <div className="col">
                <label>رقم السند:</label>
                <input
                    type="text"
                    className="form-control mb-2"
                    value={stockInVoucherId || ""}
                    onChange={(e) => setStockInVoucherId(e.target.value || "")}
                />
            </div>
            <button className="btn btn-info" onClick={handleSearch}>
                بحث عن سند
            </button>

            {showTable && (
                <table className="table table-bordered mt-3">
                    <thead>
                        <tr>
                            <th>رقم الصنف في السند </th>
                            <th>باركود</th>
                            <th>الصنف</th>
                            <th>الوحدة</th>
                            <th>الكمية</th>
                            <th>المورد</th>
                            <th>المستودع</th>
                            <th>السعر</th>
                            <th>إجمالي التكلفة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row, index) => (
                            <tr key={row.id}>
                                <td>{index + 1}</td>
                                <td>{row.code}</td>
                                <td>{row.product}</td>
                                <td>{row.unit}</td>
                                <td>{row.quantity}</td>
                                <td>{row.supplier}</td>
                                <td>{row.toWarehouse}</td>
                                <td>{row.price}</td>
                                <td>{row.totalCost}</td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            )}

            <button className="btn btn-success me-2" onClick={handleStockIn}>
                تنفيذ الإضافة
            </button>
        </div>
    );
}

export default StockInVoucherPage;
