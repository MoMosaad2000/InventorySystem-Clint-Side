import { useState, useEffect } from "react";
import { Modal, Button, Spinner, Alert } from "react-bootstrap";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import catalogPdf from '../images/cataloag.pdf';
import axiosInstance from "../utils/axiosInstance";
import { useNavigate } from 'react-router-dom';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const SalesOrderPage = () => {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const [showCatalog, setShowCatalog] = useState(false);
    const [numPages, setNumPages] = useState(null);
    const [savingCustomer, setSavingCustomer] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);
    const [orderSavedSuccess, setOrderSavedSuccess] = useState(false);
    const [customerNotFound, setCustomerNotFound] = useState(false);
    const [salesOrders, setSalesOrders] = useState([]);
    const [editingOrderId, setEditingOrderId] = useState(null);

    const [newCustomer, setNewCustomer] = useState({
        name: "", contactInfo: "", taxNumber: "", address: "", deliveryLocation: "", email: "", paymentTerms: "", paymentMethod: ""
    });

    const [orderItems, setOrderItems] = useState([
        { productName: "", productCode: "", quantity: 1, unit: "", price: 0, tax: 0, notes: "", drawing: null }
    ]);

    const [editMode, setEditMode] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const [dueDate, setDueDate] = useState("");
    const [salesRep, setSalesRep] = useState("");
    const [customerNameFilter, setCustomerNameFilter] = useState("");
    const [filteredOrders, setFilteredOrders] = useState([]);

    //const [invoiceDate] = useState(new Date().toISOString().split("T")[0]);
    //const [invoiceNumber] = useState(Math.floor(Math.random() * 10000));
    const [paymentTerms, setPaymentTerms] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");


    const navigate = useNavigate();

    useEffect(() => { fetchCustomers(); fetchSalesOrders(); fetchOrders(); }, []);

    const fetchOrders = async () => {
        try {
            const res = await axiosInstance.get("/SalesOrder");
            const orders = res.data.$values || [];
            setSalesOrders(orders);
            setFilteredOrders(orders);
        } catch (err) {
            console.error("❌ فشل تحميل الطلبات:", err);
        }
    };

    const handleSearchByCustomer = () => {
        if (!customerNameFilter.trim()) return alert("⚠️ أدخل اسم العميل للبحث!");
        const filtered = salesOrders.filter(o =>
            o.customer?.name?.toLowerCase().includes(customerNameFilter.trim().toLowerCase())
        );
        if (filtered.length === 0) alert("❌ لا يوجد طلبات لهذا العميل!");
        setFilteredOrders(filtered);
    };

    const fetchCustomers = async () => {
        try {
            const res = await axiosInstance.get("/Customers");
            setCustomers(res.data.$values);
        } catch (error) {
            console.error("❌ خطأ في تحميل العملاء:", error);
        }
    };

    const fetchSalesOrders = async () => {
        try {
            const res = await axiosInstance.get("/SalesOrder");
            setSalesOrders(res.data.$values);
        } catch (error) {
            console.error("❌ فشل في تحميل الطلبات:", error);
        }
    };

    const handleCustomerSearch = (value) => {
        setCustomerSearch(value);
        const matches = customers.filter(c => c.name?.toLowerCase().includes(value.toLowerCase()));
        setFilteredCustomers(matches);
        const exact = customers.find(c => c.name?.toLowerCase() === value.toLowerCase());
        setSelectedCustomer(exact || null);
        setCustomerNotFound(value && !exact);
    };

    const handleSelectCustomer = (customer) => {
        setCustomerSearch(customer.name);
        setSelectedCustomer(customer);
        setFilteredCustomers([]);
        setCustomerNotFound(false);
    };

    const handleAddNewCustomer = async () => {
        const { name, contactInfo, address, deliveryLocation, email } = newCustomer;
        if (!name || !contactInfo || !address || !deliveryLocation || !email  ) {
            alert("⚠️ يرجى إدخال جميع البيانات المطلوبة!");
            return;
        }
        setSavingCustomer(true);
        try {
            const res = await axiosInstance.post("/Customers", newCustomer);
            const added = res.data;
            setCustomers(prev => [...prev, added]);
            setCustomerSearch(added.name);
            setSelectedCustomer(added);
            setShowAddCustomerModal(false);
        } catch (error) {
            console.error("❌ فشل في إضافة العميل:", error);
            alert("❌ " + (error.response?.data?.message || "حدث خطأ أثناء إضافة العميل!"));
        } finally {
            setSavingCustomer(false);
        }
    };

    const handleAddProductRow = () => {
        setOrderItems([...orderItems, { productName: "", productCode: "", quantity: 1, unit: "", price: 0, tax: 0, notes: "", drawing: null }]);
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...orderItems];
        updated[index][field] = field === "price" || field === "quantity" || field === "tax" ? (value === "" ? "" : parseFloat(value)) : value;
        setOrderItems(updated);
    };

    const handleDrawingUpload = (index, file) => {
        const updated = [...orderItems];
        updated[index].drawing = file;
        setOrderItems(updated);
    };

    const handleDeleteRow = (index) => {
        const updated = [...orderItems];
        updated.splice(index, 1);
        setOrderItems(updated);
    };
    const handleEditOrder = (order) => {
        setEditingOrderId(order.id);
        setDueDate(order.expirationDate?.split("T")[0] || "");
        setSalesRep(order.representativeName || "");
        setCustomerSearch(order.customer?.name || "");
        setSelectedCustomer(order.customer || null);
        setPaymentTerms(order.paymentTerms || "");
        setPaymentMethod(order.paymentMethod || "");

        setSelectedOrder(order); // مهمة لعرض رقم الطلب

        const itemsArray = order.items?.$values || order.items || [];

        setOrderItems(
            itemsArray.map(item => {
                let drawingFile = null;

                try {
                    if (item.drawing?.startsWith("data:image")) {
                        const byteString = atob(item.drawing.split(",")[1]);
                        const ab = new ArrayBuffer(byteString.length);
                        const ia = new Uint8Array(ab);
                        for (let i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                        }
                        drawingFile = new Blob([ab], { type: 'image/jpeg' });
                    } else if (item.drawing && typeof item.drawing === "string") {
                        const binary = atob(item.drawing);
                        const array = Uint8Array.from(binary, c => c.charCodeAt(0));
                        drawingFile = new Blob([array], { type: 'image/jpeg' });
                    }
                } catch {
                    drawingFile = null;
                }

                return {
                    productName: item.orderName || item.productName || "",
                    productCode: item.productCode || item.orderCode || item.product?.code || '',
                    unit: item.unit || "",
                    quantity: item.quantity || 0,
                    price: item.unitPrice || 0,
                    tax: item.tax || 0,
                    notes: item.notes || '',
                    drawing: drawingFile
                };
            })
        );
    };

    const getTotal = () => {
        const subtotal = orderItems.reduce((acc, item) => acc + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0), 0);
        const totalTax = orderItems.reduce((acc, item) => acc + ((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0) * ((parseFloat(item.tax) || 0) / 100)), 0);
        return { subtotal, totalWithTax: subtotal + totalTax };
    };
    const handleSaveOrUpdateOrder = async () => {
        if (!selectedCustomer || !dueDate || !salesRep || !paymentTerms || !paymentMethod) {
            alert("⚠️ يرجى إدخال كل البيانات!");
            return;
        }

        if (
            orderItems.length === 0 ||
            orderItems.some(item => item.productName.trim() === "" || item.unit.trim() === "")
        ) {
            alert("⚠️ يرجى إدخال بيانات كل منتج بشكل صحيح!");
            return;
        }

        setSavingOrder(true);
        setOrderSavedSuccess(false);

        try {
            const cleanedItems = await Promise.all(orderItems.map(async (item) => {
                const quantity = parseFloat(item.quantity) || 0;
                const unitPrice = parseFloat(item.price) || 0;
                const tax = parseFloat(item.tax) || 0;
                const total = quantity * unitPrice + (quantity * unitPrice * tax / 100);
                const drawingBase64 = await fileToBase64(item.drawing);

                return {
                    orderName: item.productName,
                    productCode: item.productCode || item.orderCode || item.product?.code || '',
                    unit: item.unit,
                    quantity,
                    unitPrice,
                    tax,
                    total,
                    notes: item.notes,
                    drawing: drawingBase64
                };
            }));

            const formattedDate = new Date(dueDate).toISOString();
            const cleanedCustomer = { ...selectedCustomer };
            delete cleanedCustomer.salesOrders;
            delete cleanedCustomer.stockOutVouchers;

            const orderData = {
                customerId: cleanedCustomer.id,
                customer: cleanedCustomer,
                representativeName: salesRep,
                expirationDate: formattedDate,
                notes: editingOrderId ? "تعديل الطلب" : "أمر بيع جديد",
                subtotal: getTotal().subtotal,
                totalWithTax: getTotal().totalWithTax,
                paymentTerms,
                paymentMethod,
                items: cleanedItems,
                creationDate: editingOrderId ? selectedOrder.creationDate : new Date().toISOString()
            };

            console.log("📦 البيانات المرسلة:", orderData);

            if (editingOrderId) {
                orderData.id = editingOrderId;
                await axiosInstance.put(`/SalesOrder/${editingOrderId}`, orderData);
                setEditingOrderId(null);
            } else {
                const response = await axiosInstance.post("/SalesOrder", orderData);
                setSelectedOrder(response.data); // ✅ عشان عرض السعر يشتغل بعد أول حفظ
            }

            setOrderSavedSuccess(true);
            fetchSalesOrders();
        } catch (error) {
            console.error("❌ فشل في إرسال الطلب:", error);
            alert("❌ " + (error.response?.data?.message || "حدث خطأ أثناء إرسال الطلب!"));
        } finally {
            setSavingOrder(false);
        }
    };

    const handlePrintInvoice = async () => {
        if (!selectedCustomer || orderItems.length === 0) {
            alert("تأكد من اختيار العميل وإضافة المنتجات أولاً");
            return;
        }

        const itemsWithDrawings = await Promise.all(orderItems.map(async item => {
            let drawingBase64 = null;

            if (item.drawing instanceof File || item.drawing instanceof Blob) {
                drawingBase64 = await fileToBase64(item.drawing);
            } else if (typeof item.drawing === 'string') {
                drawingBase64 = item.drawing;
            }

            return {
                ...item,
                drawing: drawingBase64,
                price: parseFloat(item.price || 0),
                discount: parseFloat(item.discount || 0),
                quantity: parseFloat(item.quantity || 1),
                productCode: item.productCode || item.orderCode || item.product?.code || '',
                productName: item.productName,
                notes: item.notes,
            };
        }));

        const invoiceData = {
            //invoiceNumber: editingOrderId ?? Math.floor(Math.random() * 10000),
            invoiceDate: new Date().toISOString(),
            customer: selectedCustomer,
            items: itemsWithDrawings,
            total: getTotal(),
            salesRep: salesRep,
            orderDate: dueDate,
            orderNumber: selectedOrder?.orderNumber ?? '-', // ✅ هنا
            salesOrderId: selectedOrder?.id ?? '-', // ✅ هنا برضو
            creationDate: selectedOrder?.creationDate ?? new Date().toISOString()
        };
        navigate('/invoice-pdf', { state: invoiceData });
    };
    const fileToBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
        });



    const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

    return (
        <div className="container mt-4">
            <h2>أمر بيع</h2>

            <div className="row">
                <div className="col-md-6 position-relative">
                    <label>اسم العميل:</label>
                    <input
                        type="text"
                        className={`form-control ${customerNotFound ? 'is-invalid' : ''}`}
                        value={customerSearch}
                        onChange={(e) => handleCustomerSearch(e.target.value)}
                        onFocus={() => handleCustomerSearch(customerSearch)}
                    />
                    {customerNotFound && (
                        <div className="text-danger small mt-1">❌ العميل غير موجود</div>
                    )}
                    {filteredCustomers.length > 0 && (
                        <ul className="list-group position-absolute w-100 z-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {filteredCustomers.map(c => (
                                <li key={c.id} className="list-group-item list-group-item-action"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleSelectCustomer(c)}>
                                    {c.name}
                                </li>
                            ))}
                        </ul>
                    )}
                    <button
                        className="btn btn-sm btn-outline-primary mt-2"
                        onClick={() => setShowAddCustomerModal(true)}
                    >
                        ➕ إضافة عميل جديد
                    </button>
                </div>
                <div className="col-md-3">
                    <label>تاريخ التسليم:</label>
                    <input type="date" className="form-control" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div className="col-md-3">
                    <label>اسم المندوب:</label>
                    <input type="text" className="form-control" value={salesRep} onChange={(e) => setSalesRep(e.target.value)} />
                </div>
                <div className="col-md-3">
                    <label>شروط الدفع :</label>
                    <input
                        type="text"
                        className="form-control"
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                    />
                </div>

                <div className="col-md-3">
                    <label>طرق الدفع :</label>
                    <input
                        type="text"
                        className="form-control"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                </div>

            </div>

            <hr />
            <div className="row fw-bold text-center">
                <div className="col">#</div>
                <div className="col">كود المنتج</div>
                <div className="col">اسم المنتج</div>
                <div className="col">الكمية</div>
                <div className="col">الوحدة</div>
                <div className="col">السعر</div>
                <div className="col">الضريبة</div>
                <div className="col">الإجمالي</div>
                <div className="col">إجراء</div>
            </div>

            {orderItems.map((item, index) => (
                <div key={index} className="mb-3 border p-3 rounded">
                    <div className="d-flex flex-wrap gap-2 align-items-center text-center">
                        <div style={{ flex: "4%" }}>{index + 1}</div>


                        <div className="col">
                            <label htmlFor={`productCode-${index}`} className="form-label d-none">كود المنتج</label>
                            <input
                                id={`productCode-${index}`}
                                name={`productCode-${index}`}
                                className="form-control"
                                placeholder="كود المنتج"
                                value={item.productCode ?? ""}
                                onChange={(e) => handleItemChange(index, 'productCode', e.target.value)}
                            />
                        </div>

                        <div className="col">
                            <label htmlFor={`productName-${index}`} className="form-label d-none">اسم المنتج</label>
                            <input
                                id={`productName-${index}`}
                                name={`productName-${index}`}
                                className="form-control"
                                placeholder="اسم المنتج"
                                value={item.productName ?? ""}
                                onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                            />
                        </div>

                        <div className="col">
                            <label htmlFor={`quantity-${index}`} className="form-label d-none">الكمية</label>
                            <input
                                id={`quantity-${index}`}
                                name={`quantity-${index}`}
                                type="number"
                                className="form-control"
                                placeholder="الكمية"
                                value={item.quantity ?? 0}
                                onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                            />
                        </div>

                        <div className="col">
                            <label htmlFor={`unit-${index}`} className="form-label d-none">الوحدة</label>
                            <input
                                id={`unit-${index}`}
                                name={`unit-${index}`}
                                className="form-control"
                                placeholder="الوحدة"
                                value={item.unit ?? ""}
                                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            />
                        </div>

                        <div className="col">
                            <label htmlFor={`price-${index}`} className="form-label d-none">السعر</label>
                            <input
                                id={`price-${index}`}
                                name={`price-${index}`}
                                type="number"
                                className="form-control"
                                placeholder="السعر"
                                value={item.price ?? 0}
                                onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
                            />
                        </div>

                        <div className="col">
                            <label htmlFor={`tax-${index}`} className="form-label d-none">الضريبة</label>
                            <input
                                id={`tax-${index}`}
                                name={`tax-${index}`}
                                type="number"
                                className="form-control"
                                placeholder="الضريبة"
                                value={item.tax ?? 0}
                                onChange={(e) => handleItemChange(index, 'tax', parseFloat(e.target.value))}
                            />
                        </div>

                        <div className="col pt-2">
                            {(
                                (item.quantity ?? 0) * (item.price ?? 0) +
                                ((item.quantity ?? 0) * (item.price ?? 0) * ((item.tax ?? 0) / 100))
                            ).toFixed(2)}
                        </div>

                        <div className="col">
                            <button
                                className="btn btn-danger"
                                onClick={() => handleDeleteRow(index)}
                            >🗑 حذف</button>
                        </div>
                    </div>

                    <div className="row mt-2">
                        <div className="col">
                            <label htmlFor={`drawing-${index}`} className="form-label">رفع ملف الرسم:</label>
                            <input
                                id={`drawing-${index}`}
                                name={`drawing-${index}`}
                                type="file"
                                className="form-control"
                                onChange={(e) => handleDrawingUpload(index, e.target.files[0])}
                            />
                            {item.drawing && (
                                <a
                                    className="btn btn-sm btn-outline-primary mt-2"
                                    href={URL.createObjectURL(item.drawing)}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    📎 عرض الرسم
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="row mt-2">
                        <div className="col">
                            <label htmlFor={`notes-${index}`} className="form-label">ملاحظات:</label>
                            <textarea
                                id={`notes-${index}`}
                                name={`notes-${index}`}
                                className="form-control"
                                rows={2}
                                placeholder="ملاحظات..."
                                value={item.notes ?? ""}
                                onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                            ></textarea>
                        </div>
                    </div>
                </div>
            ))}

            <div className="d-flex gap-2">
                <button className="btn btn-outline-primary" onClick={handleAddProductRow}>➕ إضافة منتج</button>
            </div>

            <div className="my-4">
                <Button variant="outline-secondary" onClick={() => setShowCatalog(true)}>📘 عرض الكتالوج</Button>
            </div>

            <div className="mt-4">
                <h5>ملخص الفاتورة</h5>
                <p>الإجمالي بدون ضريبة: <strong>{getTotal().subtotal.toFixed(2)}</strong></p>
                <p>الإجمالي مع الضريبة: <strong>{getTotal().totalWithTax.toFixed(2)}</strong></p>
            </div>

            <div className="mt-3 ">
                <button className="btn btn-success me-2" onClick={handleSaveOrUpdateOrder} disabled={savingOrder}>
                    {savingOrder ? <Spinner size="sm" animation="border" /> : "💾 حفظ الطلب"}
                </button>

                <button className="btn btn-warning me-2" onClick={handleSaveOrUpdateOrder} disabled={savingOrder}>
                    {savingOrder ? <Spinner size="sm" animation="border" /> : "✏️ تعديل الطلب"}
                </button>

                {orderSavedSuccess && <Alert variant="success" className="mt-3">✅ تم تعديل الطلب بنجاح!</Alert>}

                {orderSavedSuccess && <Alert variant="success" className="mt-3">✅ تم إرسال الطلب بنجاح!</Alert>}
            </div>

            <button className="btn btn-info me-2 mt-2 mb-2" onClick={handlePrintInvoice}>
                🖨️ عرض السعر 
            </button>

            <Modal show={showAddCustomerModal} onHide={() => setShowAddCustomerModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>إضافة عميل</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {savingCustomer ? (
                        <Spinner animation="border" className="d-block mx-auto my-2" />
                    ) : (
                        <>
                            <input
                                className="form-control mb-2"
                                placeholder="اسم العميل"
                                value={newCustomer.name}
                                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                            />
                            <input
                                className="form-control mb-2"
                                placeholder="معلومات الاتصال"
                                value={newCustomer.contactInfo}
                                onChange={(e) => setNewCustomer({ ...newCustomer, contactInfo: e.target.value })}
                            />
                            <input
                                className="form-control mb-2"
                                placeholder="الرقم الضريبي"
                                value={newCustomer.taxNumber}
                                onChange={(e) => setNewCustomer({ ...newCustomer, taxNumber: e.target.value })}
                            />
                            <input
                                className="form-control mb-2"
                                placeholder="العنوان"
                                value={newCustomer.address}
                                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                            />
                            <input
                                className="form-control mb-2"
                                placeholder="مكان التسليم"
                                value={newCustomer.deliveryLocation}
                                onChange={(e) => setNewCustomer({ ...newCustomer, deliveryLocation: e.target.value })}
                            />
                            <input
                                className="form-control mb-2"
                                placeholder="البريد الإلكتروني"
                                value={newCustomer.email}
                                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                            />
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddCustomerModal(false)}>إلغاء</Button>
                    <Button variant="primary" onClick={handleAddNewCustomer}>حفظ</Button>
                </Modal.Footer>
            </Modal>


            <Modal show={showCatalog} onHide={() => setShowCatalog(false)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title>كتالوج المنتجات</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Document file={catalogPdf} onLoadSuccess={onDocumentLoadSuccess}>
                        {Array.from(new Array(numPages), (el, index) => (
                            <Page key={`page_${index + 1}`} pageNumber={index + 1} />
                        ))}
                    </Document>
                </Modal.Body>
            </Modal>

            <h2>عرض الطلبات</h2>
            <div className="row mb-3">
                <div className="col-md-6">
                    <input
                        className="form-control"
                        placeholder="اكتب اسم العميل..."
                        value={customerNameFilter}
                        onChange={(e) => setCustomerNameFilter(e.target.value)}
                    />
                </div>
                <div className="col-md-2">
                    <button className="btn btn-primary w-100" onClick={handleSearchByCustomer}>
                        🔍 عرض
                    </button>
                </div>
            </div>
            <table className="table table-bordered">
                <thead>
                    <tr className="text-center">
                        <th>#</th>
                        <th>رقم الطلب</th>
                       

                        <th>اسم العميل</th>
                        <th>المندوب</th>
                        <th>تاريخ التسليم</th>
                        <th>الإجمالي</th>
                        <th>إجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredOrders.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="text-center text-muted">لا توجد طلبات</td>
                        </tr>
                    ) : (
                        filteredOrders.map((order, index) => (
                            <tr key={order.id || index} className="text-center">
                                <td>{index + 1}</td>
                                <td>{order.orderNumber}</td>
                                <td
                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                    onClick={async () => {
                                        const items = order.items?.$values || order.items || [];

                                        const itemsWithDrawings = await Promise.all(
                                            items.map(async (item) => {
                                                let drawingBase64 = item.drawing;

                                                if (item.drawing instanceof Blob || item.drawing instanceof File) {
                                                    drawingBase64 = await fileToBase64(item.drawing);
                                                }
                                                return {
                                                    productName: item.orderName || item.productName || '',
                                                    productCode: item.productCode || item.orderCode || item.product?.code || '',
                                                    notes: item.notes,
                                                    price: item.unitPrice,
                                                    discount: item.discount || 0,
                                                    quantity: item.quantity || 1,
                                                    drawing: drawingBase64,
                                                };

                                            })
                                        );

                                        const invoiceData = {
                                            invoiceDate: new Date(order.creationDate || new Date()).toISOString().split("T")[0],
                                            customer: order.customer,
                                            items: itemsWithDrawings,
                                            total: {
                                                subtotal: order.subtotal,
                                                totalWithTax: order.totalWithTax,
                                            },
                                            salesRep: order.representativeName,
                                            orderDate: order.expirationDate,
                                            salesOrderId: order.id,
                                            orderNumber: order.orderNumber,
                                            creationDate: order.creationDate,
                                        };

                                        navigate("/invoice-pdf", { state: invoiceData });
                                    }}
                                >
                                    {order.customer?.name || '—'}
                                </td>

                                <td>{order.representativeName}</td>
                                <td>{order.expirationDate ? order.expirationDate.split("T")[0] : '-'}</td>
                                <td>{order.totalWithTax ? order.totalWithTax.toFixed(2) : '-'}</td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-warning me-2"
                                        onClick={() => handleEditOrder(order)}
                                    >
                                        ✏️ تعديل
                                    </button>                            
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>

            </table>

            {editMode && selectedOrder && (
                <div className="mt-4">
                    <h4>تعديل الطلب رقم: {selectedOrder.id}</h4>
                    <div className="row">
                        <div className="col-md-4">
                            <label>اسم المندوب:</label>
                            <input
                                className="form-control"
                                value={selectedOrder.representativeName}
                                onChange={(e) => setSelectedOrder({ ...selectedOrder, representativeName: e.target.value })}
                            />
                        </div>
                        <div className="col-md-4">
                            <label>تاريخ التسليم:</label>
                            <input
                                type="date"
                                className="form-control"
                                value={selectedOrder.expirationDate.split("T")[0]}
                                onChange={(e) => setSelectedOrder({ ...selectedOrder, expirationDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="mt-3">
                        <button className="btn btn-warning me-2" onClick={handleSaveOrUpdateOrder} disabled={savingOrder}>
                            {savingOrder ? <Spinner size="sm" animation="border" /> : "✏️ تعديل الطلب"}
                        </button>
                        <button className="btn btn-secondary" onClick={() => { setEditMode(false); setSelectedOrder(null); }}>
                            ❌ إلغاء
                        </button>
                        {orderSavedSuccess && <Alert variant="success" className="mt-3">✅ تم تعديل الطلب بنجاح!</Alert>}
                    </div>
                </div>
            )}
            <hr />
        </div>
    );
};

export default SalesOrderPage;
