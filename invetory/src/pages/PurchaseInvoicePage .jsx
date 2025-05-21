import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useDropzone } from "react-dropzone";
import { FaPaperclip } from "react-icons/fa";

//const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PurchaseInvoicePage = () => {
  const [invoiceNumber, setInvoiceNumber] = useState(1);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierContact, setNewSupplierContact] = useState("");
  const [newSupplierTaxNumber, setNewSupplierTaxNumber] = useState("");

  const [products, setProducts] = useState([]);
 
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [showProductList, setShowProductList] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    setAttachedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
    fetchLastInvoiceNumber();
  }, []);

  const fetchLastInvoiceNumber = async () => {
    try {
        const response = await axiosInstance.get(`PurchaseInvoice`);
      const invoices = response.data.$values || [];
      const maxId = invoices.length > 0 ? Math.max(...invoices.map(inv => inv.id)) : 0;
      setInvoiceNumber(maxId + 1);
    } catch (error) {
      console.error("Error fetching last invoice number:", error);
      setInvoiceNumber(1);
    }
  };

  const fetchSuppliers = async () => {
    try {
        const response = await axiosInstance.get(`suppliers`);
      setSuppliers(response.data.$values || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchProducts = async () => {
    try {
        const response = await axiosInstance.get(`products`);
      setProducts(response.data.$values || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };


    const handleAddItem = () => {

        console.log("📦 المنتج المحدد:", selectedProduct);
        console.log("📦 productId:", selectedProduct?.id);

        if (!selectedProduct || !selectedProduct.id || quantity <= 0 || price <= 0) {
            alert("⚠️ الرجاء تحديد المنتج وإدخال بيانات صحيحة.");
            return;
        }

        const product = selectedProduct; // ✅ هنا أصل التعديل
        const cost = (quantity * price) - discount;
        const totalCost = cost + (cost * (tax / 100));

        setItems([...items, {
            productId: product.id,
            productName: product.name,
            quantity: parseFloat(quantity),
            price: parseFloat(price),
            tax: parseFloat(tax),
            discount: parseFloat(discount),
            totalCost: parseFloat(totalCost.toFixed(2))
        }]);

        setSelectedProduct(null); // كان string، بقى object
        setProductSearch("");
        setQuantity(1);
        setPrice(0);
        setTax(0);
        setDiscount(0);
    };


    const handleRemoveItem = (indexToRemove) => {
        setItems(prevItems => prevItems.filter((_, index) => index !== indexToRemove));
    };

    const handleSaveInvoice = async () => {
        if (!selectedSupplier || items.length === 0) {
            alert("⚠️ الرجاء تحديد المورد وإضافة المنتجات");
            return;
        }

        // 1. إعداد بيانات الفاتورة
        const invoiceData = {
            invoiceDate,
            supplierId: parseInt(selectedSupplier),
            totalAmount: items.reduce((acc, item) => acc + item.totalCost, 0),
            items: items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                tax: item.tax,
                discount: item.discount,
                totalCost: item.totalCost
            })),
        };

        // 2. إنشاء FormData وإضافة الفاتورة والمرفقات
        const formData = new FormData();
        formData.append("invoice", JSON.stringify(invoiceData));
        attachedFiles.forEach(file => {
            formData.append("files", file);
        });

        try {
            // 3. إرسال الطلب على endpoint الصحيح
            const response = await axiosInstance.post(`PurchaseInvoice/upload`, formData);

            if (response.status === 201) {
                alert("✅ تم إنشاء الفاتورة بنجاح!");
                setItems([]);
                setSelectedSupplier("");
                setAttachedFiles([]);
                fetchLastInvoiceNumber();
            }
        } catch (error) {
            console.error("❌ Error saving invoice:", error.response?.data || error.message);
            alert("⚠️ حدث خطأ أثناء حفظ الفاتورة!");
        }
    };
  const handleAddNewSupplier = async () => {
    if (!newSupplierName || !newSupplierContact || !newSupplierTaxNumber) {
      alert("يرجى ملء كل الحقول");
      return;
    }

    const newSupplier = {
      name: newSupplierName,
      contactInfo: newSupplierContact,
      taxNumber: newSupplierTaxNumber,
    };

    try {
        const response = await axiosInstance.post(`suppliers`, newSupplier);
      setSuppliers([...suppliers, response.data]);
      alert("تم إضافة المورد بنجاح.");
    } catch (error) {
      console.error("Error adding supplier:", error);
    }
  };

  const handlePreviewInvoices = async () => {
    try {
        const response = await axiosInstance.get(`PurchaseInvoice`);
      setPurchaseInvoices(response.data.$values || []);
      setShowPreview(true);
    } catch (error) {
      console.error("❌ خطأ أثناء تحميل الفواتير:", error);
      alert("⚠️ تعذر تحميل الفواتير.");
    }
    };
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(productSearch.toLowerCase())
    );

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setProductSearch(`${product.name} (${product.code})`);
        setShowProductList(false);
    };


  return (
    <div className="container">
      <h2 className="text-primary">فاتورة شراء</h2>

      <div className="mb-3">
        <label>تاريخ الفاتورة:</label>
        <input type="date" className="form-control" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
      </div>

      <div className="mb-3">
        <label>رقم الفاتورة:</label>
        <div className="border p-2 text-center bg-light">{invoiceNumber}</div>
      </div>

      <div className="mb-3">
        <label>المورد:</label>
        <select className="form-select" value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
          <option value="">اختر المورد</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <button className="btn btn-outline-success mt-2" onClick={handleAddNewSupplier}>إضافة مورد جديد</button>

        <div className="mt-2">
          <input type="text" className="form-control mb-2" placeholder="اسم المورد" value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} />
          <input type="text" className="form-control mb-2" placeholder="رقم الهاتف" value={newSupplierContact} onChange={(e) => setNewSupplierContact(e.target.value)} />
          <input type="text" className="form-control" placeholder="الرقم الضريبي" value={newSupplierTaxNumber} onChange={(e) => setNewSupplierTaxNumber(e.target.value)} />
        </div>
      </div>

          <div className="container">
              <div className="mb-3 position-relative">
                  <label>المنتج:</label>
                  <input
                      type="text"
                      className="form-control"
                      placeholder="اكتب اسم المنتج أو الكود"
                      value={productSearch}
                      onChange={(e) => {
                          setProductSearch(e.target.value);
                          setShowProductList(true);
                          const match = products.find(p => `${p.name} (${p.code})` === e.target.value);
                          setSelectedProduct(match || null);
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
                              <li className="list-group-item list-group-item-danger">لا يوجد نتائج</li>
                          )}
                      </ul>
                  )}
              </div>
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
              <th>إجراء</th>
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
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => handleRemoveItem(index)}>🗑 حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <h5>إرفاق ملفات:</h5>
        <div {...getRootProps()} className="border p-4 text-center bg-light" style={{ cursor: "pointer" }}>
          <input {...getInputProps()} />
          {isDragActive ? <p>أسقط الملف هنا...</p> : <p>اضغط هنا أو اسحب الملفات لإرفاقها</p>}
        </div>
        {attachedFiles.length > 0 && (
          <ul className="mt-2">
            {attachedFiles.map((file, i) => (
              <li key={i}>{file.name}</li>
            ))}
          </ul>
        )}
      </div>

      <button className="btn btn-primary mt-4" onClick={handleSaveInvoice}>حفظ الفاتورة</button>
            <button className="btn btn-secondary mt-4" onClick={handlePreviewInvoices}>معاينة الفاتورة</button>

            {showPreview && purchaseInvoices.length > 0 && (
                <div className="mt-4">
                    <h4>معاينة الفواتير</h4>
                    {purchaseInvoices.map((invoice) => (
                        <div key={invoice.id} className="mb-4 border p-3 bg-light rounded">
                            <h5>فاتورة #{invoice.id} - {invoice.invoiceDate.split("T")[0]}</h5>
                            <p><strong>المورد:</strong> {invoice.supplier?.name}</p>
                            <p><strong>الهاتف:</strong> {invoice.supplier?.contactInfo}</p>
                            <p><strong>الرقم الضريبي:</strong> {invoice.supplier?.taxNumber}</p>

                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>اسم المنتج</th>
                                        <th>الكمية</th>
                                        <th>الوحدة</th>
                                        <th>السعر</th>
                                        <th>الخصم</th>
                                        <th>الضريبة</th>
                                        <th>الإجمالي</th>
                                        <th>المرفقات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(invoice.items?.$values || invoice.items || []).map((item, i) => (
                                        <tr key={item.id || i}>
                                            <td>{i + 1}</td>
                                            <td>{item.product?.name}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.unit}</td>
                                            <td>{item.price}</td>
                                            <td>{item.discount}</td>
                                            <td>{item.tax}%</td>
                                            <td>{item.totalCost}</td>
                                            <td className="text-center">
                                                {(invoice.attachments?.$values || invoice.attachments || []).map((att, j) => (
                                                    <a
                                                        key={j}
                                                        href={att.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title={att.fileName}
                                                        className="btn btn-sm btn-light"
                                                    >
                                                        <FaPaperclip />
                                                    </a>
                                                ))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PurchaseInvoicePage;
