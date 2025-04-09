import  { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PurchaseInvoicePage = () => {
    const [invoiceNumber, setInvoiceNumber] = useState(1);

    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [newSupplierName, setNewSupplierName] = useState("");
    const [newSupplierContact, setNewSupplierContact] = useState("");

    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(0);
    const [tax, setTax] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [items, setItems] = useState([]);

    useEffect(() => {
        fetchSuppliers();
        fetchProducts();
        fetchLastInvoiceNumber(); // ✅ جلب آخر رقم فاتورة
    }, []);

    const fetchLastInvoiceNumber = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}PurchaseInvoice`);
            if (response.data.$values && response.data.$values.length > 0) {
                const lastInvoice = response.data.$values[response.data.$values.length - 1];
                setInvoiceNumber(lastInvoice.id + 1); // ✅ الرقم التالي للفاتورة
            } else {
                setInvoiceNumber(1); // ✅ إذا لم تكن هناك فواتير، اجعل الرقم يبدأ من 1
            }
        } catch (error) {
            console.error("Error fetching last invoice number:", error);
            setInvoiceNumber(1); // في حال حدوث خطأ، ابدأ من 1
        }
    };


    const fetchSuppliers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}suppliers`);
            setSuppliers(response.data.$values || []);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}products`);
            setProducts(response.data.$values || []);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const handleAddItem = () => {
        if (!selectedProduct || quantity <= 0 || price <= 0) {
            alert("⚠️ الرجاء تحديد المنتج وإدخال بيانات صحيحة.");
            return;
        }

        const product = products.find((p) => p.id === parseInt(selectedProduct));

        if (!product) {
            alert("⚠️ المنتج غير موجود.");
            return;
        }
        const cost = ((quantity * price) - discount);
        const totalCost = cost + (cost * (tax / 100));

        setItems([
            ...items,
            {
                productId: product.id,
                productName: product.name,
                quantity: parseFloat(quantity),
                price: parseFloat(price),
                tax: parseFloat(tax),
                discount: parseFloat(discount),
                totalCost: parseFloat(totalCost.toFixed(2)),
            },
        ]);

        // إعادة القيم الافتراضية
        setSelectedProduct("");
        setQuantity(1);
        setPrice(0);
        setTax(0);
        setDiscount(0);
    };

    const handleSaveInvoice = async () => {
        if (!selectedSupplier || items.length === 0) {
            alert("⚠️ الرجاء تحديد المورد وإضافة المنتجات");
            return;
        }

        const invoiceData = {
            invoiceDate: new Date().toISOString(),
            supplierId: parseInt(selectedSupplier),
            totalAmount: items.reduce((acc, item) => acc + item.totalCost, 0),
            items: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                tax: item.tax,
                discount: item.discount,
                totalCost: item.totalCost
            })),
        };

        console.log("🚀 Request Data:", invoiceData);

        try {
            const response = await axios.post(`${API_BASE_URL}PurchaseInvoice`, invoiceData);
            if (response.status === 201) {
                alert("✅ تم إنشاء الفاتورة بنجاح!");
                setItems([]);
                setSelectedSupplier("");
                fetchLastInvoiceNumber(); // ✅ تحديث رقم الفاتورة بعد الحفظ
            }
        } catch (error) {
            console.error("❌ Error saving invoice:", error.response?.data || error.message);
            alert("⚠️ حدث خطأ أثناء حفظ الفاتورة!");
        }
    };

    const handleAddNewSupplier = async () => {
        if (!newSupplierName || !newSupplierContact)
        {
            alert("يرجي ملئ الحقول كاملة")
            return;
        };
        const newSupplier = {
            name: newSupplierName,
            contactInfo: newSupplierContact,
        };

        try {
            const response = await axios.post(`${API_BASE_URL}suppliers`, newSupplier);
            setSuppliers([...suppliers, response.data]);
            alert("تم إضافة المورد بنجاح.");
        } catch (error) {
            console.error("Error adding supplier:", error);
        }
    };
    //const handleSupplierChange = async (supplierId) => {
    //    setSelectedSupplier(supplierId);
    //    try {
    //        const response = await axios.get(`${API_BASE_URL}suppliers/{supplierId}/products`)
    //        setProducts(response.data || []);
    //    }
    //    catch (error) {
    //        console.error("لا يوجد أصناف لهذا المورد ",error)
    //    };

  
    return (
        <div className="container">
            <h2 className="text-primary">فاتورة شراء</h2>
            <div className="mb-3">
                <label className="form-label">رقم الفاتورة:</label>
                <div className="border p-2 text-center" style={{ backgroundColor: "#e9f7fd" }}>
                    {invoiceNumber}
                </div>
            </div>


            {/* اختيار المورد */}
            <div className="mb-3">
                <label className="form-label">المورد:</label>
                <select className="form-select" value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
                    <option value="">اختر المورد</option>
                    {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                        </option>
                    ))}
                </select>
                <button className="btn btn-outline-success mt-2" onClick={handleAddNewSupplier}>
                    إضافة مورد جديد
                </button>
                <div className="mt-2">
                    <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="اسم المورد"
                        value={newSupplierName}
                        onChange={(e) => setNewSupplierName(e.target.value)}
                    />
                    <input
                        type="text"
                        className="form-control"
                        placeholder="رقم الموبايل"
                        value={newSupplierContact}
                        onChange={(e) => setNewSupplierContact(e.target.value)}
                    />
                </div>

            </div>

            {/* اختيار المنتج وإدخال البيانات */}
            <div className="mb-3">
                <label className="form-label">المنتج:</label>
                <select className="form-select" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                    <option value="">اختر المنتج</option>
                    {products.map((product) => (
                        <option key={product.id} value={product.id}>
                            {product.name} ({product.code})
                        </option>
                    ))}
                </select>
            </div>

            <div className="row">
                <div className="col">
                    <label>الكمية:</label>
                    <input type="number" className="form-control" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div className="col">
                    <label>السعر:</label>
                    <input type="number" className="form-control" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="col">
                    <label>الضريبة (%):</label>
                    <input type="number" className="form-control" value={tax} onChange={(e) => setTax(e.target.value)} />
                </div>
                <div className="col">
                    <label>الخصم:</label>
                    <input type="number" className="form-control" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
            </div>

            <button className="btn btn-success mt-3" onClick={handleAddItem}>إضافة المنتج</button>

            {/* جدول المنتجات المضافة */}
            <div className="mt-4">
                <h4>قائمة المنتجات</h4>
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>المنتج</th>
                            <th>الكمية</th>
                            <th>السعر</th>
                            <th>الضريبة</th>
                            <th>الخصم</th>
                            <th>إجمالي التكلفة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td>{item.productName}</td>
                                <td>{item.quantity}</td>
                                <td>{item.price}</td>
                                <td>{item.tax}%</td>
                                <td>{item.discount}</td>
                                <td>{item.totalCost}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* إجمالي الفاتورة */}
            <div className="mt-3">
                <h4>إجمالي الفاتورة:</h4>
                <p>{items.reduce((acc, item) => acc + item.totalCost, 0).toFixed(2)}</p>
            </div>

            {/* حفظ الفاتورة */}
            <button className="btn btn-primary" onClick={handleSaveInvoice}>حفظ الفاتورة</button>
        </div>
    );
};

export default PurchaseInvoicePage;
