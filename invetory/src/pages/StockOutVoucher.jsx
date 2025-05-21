import { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

//const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function StockInVoucherPage() {
    const [customers, setCustomers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [products, setProducts] = useState([]);

    const [newCustomerName, setNewCustomerName] = useState("");
    const [newCustomerContact, setNewCustomerContact] = useState("");

    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [selectedWarehouse, setSelectedWarehouse] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [selectedProduct, setSelectedProduct] = useState("");
    const [productSearch, setProductSearch] = useState("");
    const [showProductList, setShowProductList] = useState(false);

    const [warehouseKeeperName, setWarehouseKeeperName] = useState("");
    const [quantity, setQuantity] = useState(0);
    const [transferDate, setTransferDate] = useState(
        new Date().toISOString().slice(0, 10)
    );
    const [operatingOrder, setOperatingOrder] = useState("");
    const [itemColor, setItemColor] = useState("");
    const [notes, setNotes] = useState("");


    const [items, setItems] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [stockOutVouchers, setStockOutVoucher] = useState([]);
    const [stockOutVoucherId, setStockOutVoucherId] = useState("");
    const [nextVoucherId, setNextVoucherId] = useState(1);
    const [showTable, setShowTable] = useState(false);

    useEffect(() => {
        fetchCustomers();
        fetchWarehouses();
        fetchCategories();
        fetchProducts();
        fetchNextVoucherId();
        fetchStockOutVoucher();
    }, []);

    useEffect(() => {
        console.log("🔍 بعد تحميل السندات:", stockOutVouchers);
    }, [stockOutVouchers]);

    const fetchStockOutVoucher = async () => {
        try {
            const response = await axiosInstance.get(`StockOutVoucher`);
            console.log("📌 السندات المحفوظة في الـ API:", response.data?.$values);
            setStockOutVoucher(response.data?.$values || []);
        } catch (error) {
            console.error("Error fetching stock transfers:", error);
        }
    };

    const fetchNextVoucherId = async () => {
        try {
            const response = await axiosInstance.get(
                `StockOutVoucher/next-id`
            );
            setNextVoucherId(response.data);
        } catch (error) {
            console.error("Error fetching next voucher ID:", error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await axiosInstance.get(`Customers`);
            setCustomers(response.data?.$values || []);
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const response = await axiosInstance.get(`warehouses`);
            setWarehouses(response.data?.$values || []);
        } catch (error) {
            console.error("Error fetching warehouses:", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axiosInstance.get(`Categories`);
            setCategories(response.data?.$values || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchSubCategories = async (categoryId) => {
        try {
            const response = await axiosInstance.get(`Subcategories`);
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
            const response = await axiosInstance.get(`products`);
            setProducts(response.data?.$values || []);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    // معاينة جميع سندات الصرف وعرضها في جدول
    const handlePreview = async () => {
        try {
            // جلب فواتير الشراء لتعيين أسعار المنتجات
            const selectedInvoice = await axiosInstance.get(
                `PurchaseInvoice`
            );
            const productPriceMap = {};
            selectedInvoice.data?.$values?.forEach((invoice) => {
                invoice.items?.$values?.forEach((item) => {
                    productPriceMap[item.productId] = item.price;
                });
            });

            // جلب سندات صرف المخزون
            const response = await axiosInstance.get(`StockOutVoucher`);
            const allStockOutVouchers = response.data?.$values || [];

            if (allStockOutVouchers.length === 0) {
                alert("⚠️ لا يوجد بيانات متاحة للعرض!");
                setTableData([]);
                return;
            }

            // نجمع جميع البنود من كل سند في مصفوفة واحدة للعرض
            const tableRows = allStockOutVouchers.flatMap((voucher) =>
                (voucher.items?.$values || []).map((item, index) => ({
                    // استخدم item.id كـ key، أو إذا لم يوجد استخدم تركيب voucher.id مع رقم الفهرس
                    id: item.id || `${voucher.id}-${index}`,
                    customer: voucher.customer?.name || "غير محدد",
                    // استخدام item.warehouseId مباشرة للعثور على اسم المستودع
                    fromWarehouse:
                        warehouses.find((w) => w.id === item.warehouseId)?.name ||
                        "غير محدد",
                    product: item?.product?.name || "غير محدد",
                    code: item?.product?.code || "غير متوفر",
                    unit: item?.unit || item?.product?.unit || "غير متوفر",
                    quantity: item.quantity ?? 0,
                    // السعر الأصلي مضروب في الكمية
                    price: (productPriceMap[item.productId] || 0) ,
                    totalCost: (productPriceMap[item.productId] || 0) * item.quantity,
                    operatingOrder: voucher.operatingOrder || "",
                    notes: voucher.notes || "",
                    colorCode: item.colorCode || ""
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
            console.error("Error fetching stock out vouchers:", error);
            alert("فشل في تحميل البيانات!");
            setTableData([]);
        }
    };

    // إضافة مشتري جديد
    const handleAddNewCustomer = async () => {
        if (!newCustomerName || !newCustomerContact) {
            alert("يرجي ملئ الحقول كاملة");
            return;
        }
        const newCustomer = {
            name: newCustomerName,
            contactInfo: newCustomerContact,
        };

        try {
            const response = await axiosInstance.post(
                `Customers`,
                newCustomer
            );
            setCustomers([...customers, response.data]);
            alert("تم إضافة المشتري بنجاح.");
        } catch (error) {
            console.error("Error adding customer:", error);
        }
    };

    // دالة إضافة عنصر للجدول (من مستودع واحد، لنفس العميل المختار)
    // ✅ دالة إضافة عنصر لسند الصرف
    // ✅ دالة إضافة عنصر
    const handleAddItem = () => {
        if (!selectedProduct || !selectedCustomer || !selectedWarehouse || quantity <= 0) {
            alert("⚠️ رجاءً قم بتحديد الصنف والمشتري والمستودع وأدخل كمية أكبر من 0.");
            return;
        }

        const product = products.find((p) => p.id === parseInt(selectedProduct));
        const customer = customers.find((c) => c.id.toString() === selectedCustomer.toString());
        const warehouse = warehouses.find((w) => w.id.toString() === selectedWarehouse.toString());
        const productPrice = product?.price || 0;
        const totalCost = Number(quantity) * productPrice;

        const newItem = {
            productId: selectedProduct.id, 
            customerId: selectedCustomer,
            warehouseId: selectedWarehouse,
            quantity: Number(quantity),
            price: productPrice,
            totalCost: totalCost,
            productName: product ? product.name : "",
            customer: customer ? customer.name : "",
            fromWarehouse: warehouse ? warehouse.name : "",
            unit: product?.unit || "",
            operatingOrder: operatingOrder || "",
            notes: notes || "",
            colorCode: itemColor || ""
        };

        setItems([...items, newItem]);
        setSelectedProduct("");
        setSelectedWarehouse("");
        setQuantity(0);
    };

    // ✅ دالة تنفيذ صرف المخزون
    const handleStockOut = async () => {
        if (items.length === 0) {
            alert("⚠️ يجب إضافة عناصر للسند!");
            return;
        }
        try {
            const purchaseRes = await axiosInstance.get(`PurchaseInvoice`);
            const productPriceMap = {};
            purchaseRes.data?.$values?.forEach(inv => {
                inv.items?.$values?.forEach(item => {
                    productPriceMap[item.productId] = item.price;
                });
            });

            const stockOutData = {
                transferDate: new Date().toISOString(),
                warehouseKeeperName: warehouseKeeperName || "غير محدد",
                notes: notes || "",
                operatingOrder: operatingOrder || "",
                customerId: parseInt(selectedCustomer),
                items: items.map((item) => {
                    const realProductId = item.productId; 
                    const product = products.find(p => p.id === realProductId);
                    const unitPrice = productPriceMap[realProductId] || 0;

                    return {
                        productId: realProductId,
                        customerId: parseInt(selectedCustomer),
                        warehouseId: parseInt(item.warehouseId),
                        quantity: item.quantity,
                        price: unitPrice * item.quantity,
                        unit: product?.unit || "غير محدد",
                        tax: 0,
                        discount: 0,
                        colorCode: item.colorCode || ""
                    };
                })
            };

            console.log("🚀 سيتم إرسال:", JSON.stringify(stockOutData, null, 2));

            const res = await axiosInstance.post("StockOutVoucher", stockOutData);

            if (res.status === 201) {
                alert("✅ تم صرف المخزون بنجاح!");
                setItems([]);
            } else {
                alert("❌ فشل في صرف المخزون!");
            }
        } catch (error) {
            console.error("❌ خطأ أثناء الإرسال:", error.response?.data || error);
            alert("❌ فشل في صرف المخزون! تحقق من البيانات.");
        }
    };


    // البحث عن سند صرف محدد (برقم السند)
    const handleSearch = async () => {
        if (!stockOutVoucherId) {
            alert("⚠️ يجب إدخال رقم السند!");
            return;
        }

        // جلب أسعار المنتجات من فواتير الشراء
        const selectedOutvoice = await axiosInstance.get(`PurchaseInvoice`);
        const productPriceMap = {};
        selectedOutvoice.data?.$values.forEach((invoice) => {
            invoice.items?.$values.forEach((item) => {
                productPriceMap[item.productId] = item.price;
            });
        });

        try {
            const response = await axiosInstance
                .get(`StockOutVoucher/${stockOutVoucherId}`)
                .catch((error) => {
                    console.error("Error fetching stock Out voucher by ID:", error);
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

            const tableRows = voucher.items.$values.map((item, index) => {
                // حاول أولاً أخذ اسم العميل من مستوى العنصر item.customer
                // وإن لم يكن موجوداً فخذ اسم العميل من مستوى السند voucher.customer
                const itemCustomerName = item.customer?.name;
                const voucherCustomerName = voucher.customer?.name;

                return {
                    id: item.id || `${voucher.id}-${index}`,
                    // نجمع اسم المشتري من item.customer أو voucher.customer
                    customer: itemCustomerName || voucherCustomerName || "غير محدد",
                    fromWarehouse:
                        warehouses.find((w) => w.id === item.warehouseId)?.name || "غير محدد",
                    product: item?.product?.name || "غير محدد",
                    code: item?.product?.code || "غير متوفر",
                    unit: item.unit || item?.product?.unit || "غير متوفر",
                    quantity: item.quantity,
                    price: (productPriceMap[item.productId] || 0) ,
                    totalCost: (productPriceMap[item.productId] || 0) * item.quantity,
                    operatingOrder: voucher.operatingOrder || "",
                    notes: voucher.notes || "",
                    colorCode: item.colorCode || ""
                };
            });

            setTableData(tableRows);
            setShowTable(true);
        } catch (error) {
            console.error("Error fetching stock out voucher by ID:", error);
            alert("فشل في البحث عن السند.");
            setTableData([]);
        }
    };
    const handleRemoveItem = (indexToRemove) => {
        setItems(prevItems => prevItems.filter((_, index) => index !== indexToRemove));
    };
    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.code.toLowerCase().includes(productSearch.toLowerCase())
    );

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setProductSearch(`${product.name} (${product.code})`);
        setItemColor(product.colorCode || "");
        setShowProductList(false);
    };

    return (
        <div className="container mt-4">
            <h2>سند صرف مخزني</h2>
            <div className="row">
                <div className="row  mb-3">
                    <div className="col-md-6">
                        <label>رقم السند:</label>
                        <input
                            type="text"
                            className="form-control mb-2"
                            value={nextVoucherId}
                            readOnly
                        />
                    </div>
                    <div className="col-md-6">
                        <label>تاريخ السند:</label>
                        <input
                            type="date"
                            className="form-control mb-2"
                            value={transferDate}
                            onChange={(e) => setTransferDate(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6">
                    <label>اختر المشتري:</label>
                    <select
                        className="form-select mb-2"
                        value={selectedCustomer}
                        onChange={(e) => {
                            console.log("تم اختيار العميل:", e.target.value);
                            setSelectedCustomer(e.target.value);
                        }}
                    >
                        <option value="">اختر المشتري</option>
                        {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                                {customer.name}
                            </option>
                        ))}
                    </select>

                    <button
                        className="btn btn-outline-success mt-2"
                        onClick={handleAddNewCustomer}
                    >
                        إضافة مشتري جديد
                    </button>
                    <div className="mt-2">
                        <input
                            type="text"
                            className="form-control mb-2"
                            placeholder="اسم المشتري"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                        />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="رقم الموبايل"
                            value={newCustomerContact}
                            onChange={(e) => setNewCustomerContact(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6">
                    <label>من المستودع:</label>
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
                <div className="row mb-3">
                    <div className="col-md-4">
                        <label>اسم أمين المستودع:</label>
                        <input type="text" className="form-control" value={warehouseKeeperName} onChange={(e) => setWarehouseKeeperName(e.target.value)} />
                    </div>
                    <div className="col-md-4">
                        <label>التوقيع:</label>
                        <input type="text" className="form-control mb-2" />
                    </div>
                    <div className="col col-md-4">
                        <label>المستلم:</label>
                        <input type="text" className="form-control mb-2" placeholder="يوقع عند الاستلام" />
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-4">
                        <label>أمر التشغيل:</label>
                        <input
                            type="text"
                            className="form-control mb-2"
                            placeholder="أدخل أمر التشغيل"
                            value={operatingOrder}
                            onChange={(e) => setOperatingOrder(e.target.value)}
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
                <div className="row mb-3">
                    <div className="col-md-6 position-relative">
                        <label>عرض الصنف :</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="أكتب أسم او كود الصنف"
                            value={productSearch}
                            onChange={(e) => {
                                setProductSearch(e.target.value);
                                setShowProductList(true);
                            }}
                            onFocus={() => setShowProductList(true)}
                        />
                            {showProductList && (
                                <ul className="list-group position-absolute w-100 z-3" style={{ maxHeight: "200px", overflowY: "auto" }}>
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map((product) => (
                                            <li
                                                key={product.id}
                                                className="list-group-item list-group-item-action"
                                                onClick={() => handleProductSelect(product)}
                                                style={{ cursor: "pointer" }}
                                            >
                                                {product.name} ({product.code})
                                            </li>
                                        ))
                                    ) : (
                                        <li className="list-group-item text-muted">لا يوجد نتائج</li>
                                    )}
                                </ul>
                            )}
                    </div>
                    <div className="col-md-6">
                        <label>رقم الصنف:</label>
                        <input
                            type="text"
                            className="form-control"
                            value={selectedProduct?.code || ""}
                            readOnly
                        />
                    </div>
                </div>
            </div>
            <div className="row mb-3">
                <div className="col-md-2">
                    <label>الكمية:</label>
                    <input
                        type="number"
                        className="form-control"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />
                </div>
                <div className="col-md-4">
                    <label>كود اللون:</label>
                    <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="مثال: #FF5733"
                        value={itemColor}
                        onChange={(e) => setItemColor(e.target.value)}
                    />
                </div>
            </div>
            <div className="row mb-3">
                <div className="col">
                    <label>الملاحظات:</label>
                    <textarea
                        className="form-control mb-2"
                        rows="3"
                        placeholder="اكتب الملاحظات هنا (اختياري)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
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
                            <th>مشتري</th>
                            <th>من مستودع</th>
                            <th>الكمية</th>
                            <th>إجمالي التكلفة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td>{item.productName}</td>
                                <td>{item.customer}</td>
                                <td>{item.fromWarehouse}</td>
                                <td>{item.quantity}</td>
                                <td>{item.totalCost}</td>
                                <td>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleRemoveItem(index)}>🗑 حذف</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <button className="btn btn-primary" onClick={handlePreview}>
                معاينة
            </button>
            <div className="col ">
                <label>رقم السند:</label>
                <input
                    type="text"
                    className="form-control mb-2"
                    value={stockOutVoucherId || ""}
                    onChange={(e) => setStockOutVoucherId(e.target.value || "")}
                />
            </div>
            <button className="btn btn-info me-2" onClick={handleSearch}>
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
                            <th>المشتري</th>
                            <th>من مستودع</th>
                            <th>السعر</th>
                            <th>إجمالي التكلفة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row,index) => (
                            <tr key={row.id}>
                                <td>{index + 1}</td> 
                                <td>{row.code}</td>
                                <td>{row.product}</td>
                                <td>{row.unit}</td>
                                <td>{row.quantity}</td>
                                <td>{row.customer}</td>
                                <td>{row.fromWarehouse}</td>
                                <td>{row.price}</td>
                                <td>{row.totalCost}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <button className="btn btn-success me-2" onClick={handleStockOut}>
                تنفيذ الصرف
            </button>
        </div>
    );
}

export default StockInVoucherPage;
