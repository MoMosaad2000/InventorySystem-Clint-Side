﻿import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://inventory2025.runasp.net/api/";


function StockTransferPage() {
    const [warehouses, setWarehouses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedWarehouseFrom, setSelectedWarehouseFrom] = useState("");
    const [selectedWarehouseTo, setSelectedWarehouseTo] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [selectedProduct, setSelectedProduct] = useState("");
    const [quantity, setQuantity] = useState(0);
    const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
    const [showTable, setShowTable] = useState(false);
    const [warehouseKeeperName, setWarehouseKeeperName] = useState("");
    const [tableData, setTableData] = useState([]);
    const [stockTransfers, setStockTransfers] = useState([]); // To store all stock transfers
    const [stockTransferId, setStockTransferId] = useState(""); // ID البحث
     
    useEffect(() => {
        fetchWarehouses();
        fetchCategories();
        fetchProducts();
        fetchStockTransfers(); // Fetch all stock transfers
    }, []);

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
            const filteredSubCategories = response.data?.$values.filter(sc => sc.categoryId === parseInt(categoryId)) || [];
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
    // Fetch stock transfers data
    const fetchStockTransfers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}StockTransfer`);
            setStockTransfers(response.data?.$values || []);
        } catch (error) {
            console.error("Error fetching stock transfers:", error);
        }
    };
    //const handlePreview = () => {
    //    let filteredProducts = products;

    //    if (selectedProduct) {
    //        filteredProducts = products.filter(p => p.id === parseInt(selectedProduct));
    //    } else if (selectedSubCategory) {
    //        filteredProducts = products.filter(p => p.subCategoryId === parseInt(selectedSubCategory));
    //    } else if (selectedCategory) {
    //        const relatedSubCategories = subCategories.filter(sc => sc.categoryId === parseInt(selectedCategory)).map(sc => sc.id);
    //        filteredProducts = products.filter(p => relatedSubCategories.includes(p.subCategoryId) || p.subCategory?.categoryId === parseInt(selectedCategory));
    //    }
    //    // Fetch price from the purchase invoice based on productId
    //    const selectedInvoice = await axios.get(`${API_BASE_URL}PurchaseInvoice`);
    //    const productPriceMap = {};
    //    selectedInvoice.data?.$values.forEach(invoice => {
    //        invoice.items?.$values.forEach(item => {
    //            productPriceMap[item.productId] = item.price; // Mapping productId to price
    //        });
    //    });

    //    const tableRows = filteredProducts.map((product, index) => ({
    //        id: index + 1,
    //        product: product.name,
    //        code: product.code,
    //        unit: product.unit,
    //        quantity: quantity,
    //        fromWarehouse: warehouses.find(w => w.id === parseInt(selectedWarehouseFrom))?.name || "غير محدد",
    //        toWarehouse: warehouses.find(w => w.id === parseInt(selectedWarehouseTo))?.name || "غير محدد",
    //        price: product.purchasePrice || 0,  // Assuming price is available in the product
    //        totalCost: quantity * (product.purchasePrice || 0)
    //    }));

    //    setTableData(tableRows);
    //    setShowTable(true);
    //};
    const handlePreview = async () => {
        // Fetch price from the purchase invoice based on productId
        const selectedInvoice = await axios.get(`${API_BASE_URL}PurchaseInvoice`);
        const productPriceMap = {};
        selectedInvoice.data?.$values.forEach(invoice => {
            invoice.items?.$values.forEach(item => {
                productPriceMap[item.productId] = item.price; // Mapping productId to price
            });
        });

        //const filteredTransfers = stockTransfers.filter(transfer =>
        //(transfer.fromWarehouseId === parseInt(selectedWarehouseFrom) ||
        //    transfer.toWarehouseId === parseInt(selectedWarehouseTo))
        //);
        const response = await axios.get(`${API_BASE_URL}StockTransfer`);
        const allStockInVouchers = response.data?.$values || [];

        if (allStockInVouchers.length === 0) {
            alert("⚠️ لا يوجد بيانات متاحة للعرض!");
            setTableData([]);
            return;
        }

        const tableRows = allStockInVouchers.flatMap((transfer) =>
            transfer.items?.$values.map((item) => ({
                id: transfer.id,
                product: item.product.name,
                code: item.product.code,
                unit: item.unit,
                quantity: item.quantity,
                fromWarehouse: warehouses.find(w => w.id === transfer.fromWarehouseId)?.name || "غير محدد",
                toWarehouse: warehouses.find(w => w.id === transfer.toWarehouseId)?.name || "غير محدد",
                price: productPriceMap[item.productId] || 0,
                totalCost: item.quantity * (productPriceMap[item.productId] || 0)
            }))
        );

        setTableData(tableRows);
        setShowTable(true);
    };
    // Search function to find stock transfer by ID
    const handleSearch = async () => {
        if (!stockTransferId) {
            alert("⚠️ يجب إدخال رقم السند!");
            return;
        }
        // Fetch price from the purchase invoice based on productId
        const selectedInvoice = await axios.get(`${API_BASE_URL}PurchaseInvoice`);
        const productPriceMap = {};
        selectedInvoice.data?.$values.forEach(invoice => {
            invoice.items?.$values.forEach(item => {
                productPriceMap[item.productId] = item.price; // Mapping productId to price
            });
        });

        try {
            const response = await axios.get(`${API_BASE_URL}StockTransfer/${stockTransferId}`);
            const transferData = response.data;
            const tableRows = transferData.items?.$values.map((item) => ({
                id: transferData.id,
                product: item.product.name,
                code: item.product.code,
                unit: item.unit,
                quantity: item.quantity,
                fromWarehouse: warehouses.find(w => w.id === transferData.fromWarehouseId)?.name || "غير محدد",
                toWarehouse: warehouses.find(w => w.id === transferData.toWarehouseId)?.name || "غير محدد",
                price: productPriceMap[item.productId] || 0,
                totalCost: item.quantity * (productPriceMap[item.productId] || 0)
            }));

            setTableData(tableRows);
            setShowTable(true);
        } catch (error) {
            console.error("Error fetching stock transfer by ID:", error);
            alert("فشل في البحث عن السند.");
        }
    };


    const handleStockTransfer = async () => {
        if (!selectedWarehouseFrom || !selectedWarehouseTo || !selectedProduct || quantity <= 0) {
            alert("⚠️ يجب تحديد كل القيم المطلوبة!");
            return;
        }
        try {
            const selectedProductName = products.find(p => p.id == selectedProduct)?.name;
            const selectedWarehouseFromName = warehouses.find(w => w.id == selectedWarehouseFrom)?.name;
            const selectedWarehouseToName = warehouses.find(w => w.id == selectedWarehouseTo)?.name;

            const transferData = {
                fromWarehouseId: parseInt(selectedWarehouseFrom),
                toWarehouseId: parseInt(selectedWarehouseTo),
                warehouseKeeperName: warehouseKeeperName,
                transferDate: transferDate,
                notes: `نقل ${quantity} من المنتج ${selectedProductName} من مستودع ${selectedWarehouseFromName} إلى مستودع ${selectedWarehouseToName}`,
                items: [
                    {
                        productId: parseInt(selectedProduct),
                        unit: products.find(p => p.id == selectedProduct)?.unit || "حبة",
                        quantity: parseInt(quantity),
                        price: products.find(p => p.id == selectedProduct)?.purchasePrice || 0
                    }
                ]
            };

            const response = await axios.post(`${API_BASE_URL}StockTransfer`, transferData);

            if (response.status === 201) {
                alert("تم تحويل المخزون بنجاح ✅");
                fetchStockTransfers();  // Fetch updated stock transfers
            } else {
                throw new Error("حدث خطأ أثناء تحويل المخزون!");
            }
        } catch (error) {
            console.error("Error transferring stock:", error);
            alert("حدث خطأ أثناء نقل المخزون!");
        }
    };

    return (
        <div className="container mt-4">
            <h2>سند تحويل مخزني</h2>
            <div className="row">
                <div className="col">
                    <label>رقم السند:</label>
                    <input
                        type="text"
                        className="form-control mb-2"
                        value={stockTransfers.length > 0 ? stockTransfers[stockTransfers.length - 1].id + 1 : 1}
                        disabled
                    />


                </div>

                <div className="col">
                    <label>تاريخ السند:</label>
                    <input type="date" className="form-control mb-2" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
                </div>
            </div>

            <div className="row">
                <div className="form-group">
                    <label>اسم أمين المستودع:</label>
                    <input type="text" className="form-control" value={warehouseKeeperName} onChange={(e) => setWarehouseKeeperName(e.target.value)} />
                </div>
                <div className="col">
                    <label>التوقيع:</label>
                    <input type="text" className="form-control mb-2" placeholder="توقيع" />
                </div>
            </div>

            <div className="row">
                <div className="col">
                    <label>المستلم:</label>
                    <input type="text" className="form-control mb-2" placeholder="يوقع عند الاستلام" />
                </div>
            </div>

            <div className="row">
                <div className="col">
                    <label>من المستودع:</label>
                    <select className="form-select mb-2" value={selectedWarehouseFrom} onChange={(e) => setSelectedWarehouseFrom(e.target.value)}>
                        <option value="">اختر المستودع</option>
                        {warehouses.map((warehouse) => (
                            <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                        ))}
                    </select>
                </div>

                <div className="col">
                    <label>إلى المستودع:</label>
                    <select className="form-select mb-2" value={selectedWarehouseTo} onChange={(e) => setSelectedWarehouseTo(e.target.value)}>
                        <option value="">اختر المستودع</option>
                        {warehouses.map((warehouse) => (
                            <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="row">
                <div className="col">
                    <label>التصنيف الرئيسي:</label>
                    <select className="form-select mb-2" value={selectedCategory} onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        fetchSubCategories(e.target.value);
                    }}>
                        <option value="">اختر التصنيف</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </select>
                </div>

                <div className="col">
                    <label>التصنيف الفرعي:</label>
                    <select className="form-select mb-2" value={selectedSubCategory} onChange={(e) => setSelectedSubCategory(e.target.value)}>
                        <option value="">اختر التصنيف الفرعي</option>
                        {subCategories.map((subCategory) => (
                            <option key={subCategory.id} value={subCategory.id}>{subCategory.name}</option>
                        ))}
                    </select>
                </div>

                <div className="col">
                    <label>الصنف:</label>
                    <select className="form-select mb-2" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                        <option value="">اختر الصنف</option>
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>{product.name} ({product.code})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="row">
                <div className="col">
                    <label>الكمية:</label>
                    <input type="number" className="form-control mb-2" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
            </div>

            <button className="btn btn-primary" onClick={handlePreview}>معاينة</button>
            <div className="col">
                <label>رقم السند:</label>
                <input
                    type="text"
                    className="form-control mb-2"
                    value={stockTransferId}
                    onChange={(e) => setStockTransferId(e.target.value)} // For searching by ID
                />
            </div>
            <button className="btn btn-info" onClick={handleSearch}>بحث عن سند</button>

            {showTable && (
                <table className="table table-bordered mt-3">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>رقم الصنف في السند</th>
                            <th>الصنف</th>
                            <th>الوحدة</th>
                            <th>الكمية</th>
                            <th>من مستودع</th>
                            <th>إلى مستودع</th>
                            <th>السعر</th>
                            <th>إجمالي التكلفة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row,index) => (
                            <tr key={index+1}>
                                <td>{row.id}</td>
                                <td>{row.code}</td>
                                <td>{row.product}</td>
                                <td>{row.unit}</td>
                                <td>{row.quantity}</td>
                                <td>{row.fromWarehouse}</td>
                                <td>{row.toWarehouse}</td>
                                <td>{row.price}</td>
                                <td>{row.totalCost}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <button className="btn btn-success me-2" onClick={handleStockTransfer}>تنفيذ التحويل</button>
        </div>
    );
}

export default StockTransferPage;
