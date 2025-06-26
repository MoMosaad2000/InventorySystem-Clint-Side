import  { useState, useEffect } from "react";
import { Form, Button, Table, Row, Col, Spinner } from "react-bootstrap";
import axiosInstance from "../utils/axiosInstance";

import { Modal } from "react-bootstrap";

const ProductForm = () => {
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        unit: "",
        mainCategory: "",
        subCategory: "",
        warehouse: "",
        description: "",
        image: null,
        productionDuration: "",
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [materials, setMaterials] = useState([
        { id: 1, name: "", code: "", unit: "", quantity: "", price: "", cost: "" },
    ]);
    const [mainCategories, setMainCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [showFinalProducts, setShowFinalProducts] = useState(false);
    const [finalProducts, setFinalProducts] = useState([]);

    const [selectedProduct, setSelectedProduct] = useState(null); // للمنتج المختار
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    // ✅ تكاليف غير مباشرة
    const [indirectCosts, setIndirectCosts] = useState([]);
    const [showIndirectModal, setShowIndirectModal] = useState(false);
    const [indirectCostData, setIndirectCostData] = useState({
        accountCode: "",
        accountName: "",
        allocationBasis: "",
        unitCost: "",
        mainClassification: ""
    });
    const [accountError, setAccountError] = useState("");


    // جلب البيانات الأولية
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [categoriesRes, subCategoriesRes, warehousesRes, productsRes] = await Promise.all([
                    axiosInstance.get("Categories"),
                    axiosInstance.get("SubCategories"),
                    axiosInstance.get("Warehouses"),
                    axiosInstance.get("Products"),
                ]);

                setMainCategories(categoriesRes.data?.$values || []);
                setSubCategories(subCategoriesRes.data?.$values || []);
                setWarehouses(warehousesRes.data?.$values || []);
                setProducts(productsRes.data?.$values || []);
            } catch (err) {
                setError("فشل في تحميل البيانات الأولية");
                console.error("خطأ في جلب البيانات الأولية:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (showFinalProducts) {
            axiosInstance.get("FinalProduct")
                .then(res => {
                    const list = res.data?.$values || res.data || [];
                    // تأكد المكونات مظبوطة داخل كل منتج
                    list.forEach(p => {
                        p.components = p.components?.$values || [];
                    });
                    setFinalProducts(list);
                })
                .catch(err => {
                    console.error("فشل في تحميل المنتجات:", err);
                });
        }
    }, [showFinalProducts]);

    // ✅ التحقق من الحساب عند التغيير
    const handleAccountCodeChange = (e) => {
        const code = e.target.value;
        setIndirectCostData({ ...indirectCostData, accountCode: code });

        setAccountError("");
        if (code.length >= 3 && code !== "123") {
            setAccountError("هذا الحساب لم يضف بعد");
        } else if (code === "123") {
            setIndirectCostData((prev) => ({ ...prev, accountName: "حساب الرواتب" }));
        }
    };

    // ✅ إضافة الحساب للجدول
    const handleAddIndirectCost = () => {
        if (accountError) return;
        setIndirectCosts((prev) => [...prev, { ...indirectCostData }]);
        setIndirectCostData({ accountCode: "", accountName: "", allocationBasis: "", unitCost: "", mainClassification: "" });
        setShowIndirectModal(false);
    };


    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "image") {
            setFormData({ ...formData, image: files[0] });
            setImagePreview(URL.createObjectURL(files[0]));
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };
    // ✅ handleMaterialChange (محدث)
    // ✅ handleMaterialChange (نهائي)
    const handleMaterialChange = (index, field, value) => {
        const updated = [...materials];
        updated[index][field] = value;

        if (field === "name") {
            const selectedProduct = products.find(p => p.name === value);
            if (selectedProduct) {
                updated[index].code = selectedProduct.code;
                updated[index].unit = selectedProduct.unit;
                updated[index].rawMaterialId = selectedProduct.id;
                updated[index].unitId = selectedProduct.unitId || 1;
                updated[index].name = selectedProduct.name;
            } else {
                updated[index].code = "";
                updated[index].unit = "";
                updated[index].rawMaterialId = 0;
                updated[index].unitId = 0;
                updated[index].name = "";
            }
        }

        if (field === "quantity" || field === "price") {
            const qty = parseFloat(updated[index].quantity) || 0;
            const price = parseFloat(updated[index].price) || 0;
            updated[index].cost = (qty * price).toFixed(2);
        }

        setMaterials(updated);
    };


    const addMaterialRow = () => {
        setMaterials([
            ...materials,
            { id: materials.length + 1, name: "", code: "", unit: "", quantity: "", price: "", cost: "" },
        ]);
    };
    const totalCost = materials.reduce((acc, m) => acc + parseFloat(m.cost || 0), 0);
    // دالة لتحويل الصورة إلى base64 string بدون بادئة البيانات (data:image/...)
    //const toBase64 = (file) =>
    //    new Promise((resolve, reject) => {
    //        const reader = new FileReader();
    //        reader.readAsDataURL(file);
    //        reader.onload = () => {
    //            // نقطع البادئة "data:image/png;base64," ونرسل بس النص بعد الكوما
    //            const base64String = reader.result.split(",")[1];
    //            resolve(base64String);
    //        };
    //        reader.onerror = (error) => reject(error);
    //    });

 
    // ✅ handleSubmit (محدث بالكامل)
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const form = new FormData();
            form.append("name", formData.name);
            form.append("code", formData.code);
            form.append("mainCategoryId", parseInt(formData.mainCategory));
            form.append("subCategoryId", parseInt(formData.subCategory));
            form.append("unit", formData.unit);
            form.append("warehouseId", parseInt(formData.warehouse));
            form.append("description", formData.description);
            form.append("productionDurationHours", parseFloat(formData.productionDuration));
            if (formData.image) form.append("imageFile", formData.image);

            const formattedComponents = materials.map(m => ({
                rawMaterialId: m.rawMaterialId || 0,
                name: m.name,
                code: m.code,
                unitId: m.unitId || 0,
                quantity: parseFloat(m.quantity) || 0,
                price: parseFloat(m.price) || 0,
            }));

            const formattedIndirects = indirectCosts.map(i => ({
                accountCode: i.accountCode,
                accountName: i.accountName,
                allocationBasis: i.allocationBasis,
                unitCost: parseFloat(i.unitCost) || 0,
                mainClassification: i.mainClassification,
            }));

            console.log("📦 formattedComponents", formattedComponents);
            console.log("📦 formattedIndirects", formattedIndirects);

            form.append("components", JSON.stringify(formattedComponents));
            form.append("indirectCosts", JSON.stringify(formattedIndirects));
            if (formattedComponents.length === 0 || formattedComponents.every(c => c.rawMaterialId === 0)) {
                alert("❌ برجاء اختيار مكونات صحيحة للمنتج");
                return;
            }
            if (formattedIndirects.length === 0 || formattedIndirects.every(i => i.accountCode === "")) {
                alert("❌ برجاء إدخال التكاليف غير المباشرة");
                return;
            }

            await axiosInstance.post("/FinalProduct", form, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            alert("✅ تم الحفظ بنجاح");
        } catch (err) {
            console.error("❌ خطأ في الحفظ:", err);
            alert("⚠️ فشل في حفظ المنتج.");
        }
    };



    if (loading) {
        return (
            <div className="container mt-4 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">جاري التحميل...</span>
                </Spinner>
                <p>جاري تحميل البيانات...</p>
            </div> 
        );
    }
    if (error) {
        return (
            <div className="container mt-4 text-center">
                <p className="text-danger">{error}</p>
            </div>
        );
    }
    return (
        <div className="container mt-4">
            <h3 className="mb-3">إضافة منتج</h3>
            <Form onSubmit={handleSubmit}>
                {/* الصف الأول */}
                <Row className="mb-3">
                    <Col>
                        <Form.Group controlId="code">
                        <Form.Label> كود المنتج</Form.Label>
                        <Form.Control
                            name="code"
                            placeholder="كود المنتج"
                            value={formData.code}
                            onChange={handleInputChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group controlId="name">
                        <Form.Label> أسم المنتج </Form.Label>
                        <Form.Control
                            name="name"
                            placeholder="اسم المنتج"
                            value={formData.name}
                            onChange={handleInputChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group controlId="unit">
                            <Form.Label> الوحدة  </Form.Label>
                        <Form.Control
                            name="unit"
                            placeholder="الوحدة"
                            value={formData.unit}
                            onChange={handleInputChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                {/* الصف الثاني */}
                <Row className="mb-3">
                    <Col>
                        <Form.Group controlId="mainCategory">
                        <Form.Label>التصنيف الرئيسي</Form.Label>
                        <Form.Select
                            name="mainCategory"
                            value={formData.mainCategory}
                            onChange={handleInputChange}
                        >
                            <option value="">اختر الصنف الرئيسي</option>
                            {mainCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group controlId="subCategory">
                        <Form.Label>التصنيف الفرعي</Form.Label>
                        <Form.Select
                            name="subCategory"
                            value={formData.subCategory}
                            onChange={handleInputChange}
                        >
                            <option value="">اختر الصنف الفرعي</option>
                            {subCategories.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.name}
                                </option>
                            ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group controlId="warehouse">
                        <Form.Label> المستودع</Form.Label>
                        <Form.Select
                       
                            name="warehouse"
                            value={formData.warehouse}
                            onChange={handleInputChange}
                        >
                            <option value="">اختر المستودع</option>
                            {warehouses.map((wh) => (
                                <option key={wh.id} value={wh.id}>
                                    {wh.name}
                                </option>
                            ))}
                        </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                {/* الصف الثالث */}
                <Row className="mb-3">
                    <Col>
                        <Form.Group controlId="description">
                        <Form.Label> الوصف</Form.Label>
                        <Form.Control
                            name="description"
                            placeholder="الوصف"
                            value={formData.description}
                            onChange={handleInputChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group controlId="image">
                        <Form.Label> معاينة المنتج</Form.Label>
                        <Form.Control type="file" name="image" onChange={handleInputChange} />
                        {imagePreview && (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                style={{
                                    width: "200px",
                                    height: "200px",
                                    objectFit: "cover",
                                    marginTop: "10px",
                                }}
                            />
                            )}
                        </Form.Group>
                    </Col>

                    <Col>
                        <Form.Group controlId="productionDuration">
                        <Form.Label>  مدة انتاج الوحدة</Form.Label>
                        <Form.Control
                            name="productionDuration"
                            placeholder="الرقم ب الساعة "
                            value={formData.productionDuration}
                            onChange={handleInputChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Button type="submit" className="mb-4">
                    حفظ المنتج
                </Button>
            </Form>

            {/* جدول المواد */}
            <h4 className="mt-5">مكونات المنتج</h4>
            <Table bordered>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>اسم الصنف</th>
                        <th>الكود</th>
                        <th>الوحدة</th>
                        <th>الكمية</th>
                        <th>السعر</th>
                        <th>تكلفة الوحدة من الخامات</th>
                    </tr>
                </thead>
                <tbody>
                    {materials.map((material, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                                <Form.Select
                                    value={material.rawMaterialId || ""}
                                    onChange={(e) => {
                                        const selectedId = parseInt(e.target.value);
                                        const selectedProduct = products.find(p => p.id === selectedId);
                                        if (selectedProduct) {
                                            handleMaterialChange(index, "name", selectedProduct.name); // موجود فعليًا
                                        }
                                    }}
                                >
                                    <option value="">اختر الصنف</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </Form.Select>

                            </td>
                            <td>
                                <Form.Control value={material.code} disabled />
                            </td>
                            <td>
                                <Form.Control value={material.unit} disabled />
                            </td>
                            <td>
                                <Form.Control
                                    type="number"
                                    value={material.quantity}
                                    onChange={(e) => handleMaterialChange(index, "quantity", e.target.value)}
                                />
                            </td>
                            <td>
                                <Form.Control
                                    type="number"
                                    value={material.price}
                                    onChange={(e) => handleMaterialChange(index, "price", e.target.value)}
                                />
                            </td>
                            <td>
                                <Form.Control value={material.cost} disabled />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>


            <Button variant="secondary" onClick={addMaterialRow}>
                إضافة صف جديد
            </Button>
            {/* إجمالي التكلفة */}
            <div className="mt-4">
                <h5>
                    التكلفة الإجمالية:{" "}
                    <span className="text-success">{totalCost.toFixed(2)} ر.س</span>
                </h5>
            </div>
            <h5 className="mt-4">التكاليف غير المباشرة</h5>
            <table className="table table-bordered mt-2 text-center">
                <thead className="table-light">
                    <tr>
                        <th>كود الحساب</th>
                        <th>اسم الحساب</th>
                        <th>معيار التوزيع</th>
                        <th>تكلفة الوحدة</th>
                        <th>التصنيف الرئيسي</th>
                    </tr>
                </thead>
                <tbody>
                    {indirectCosts.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-muted text-center">لا توجد تكاليف مضافة</td>
                        </tr>
                    ) : (
                        indirectCosts.map((cost, index) => (
                            <tr key={index}>
                                <td>{cost.accountCode}</td>
                                <td>{cost.accountName}</td>
                                <td>{cost.allocationBasis}</td>
                                <td>{cost.unitCost}</td>
                                <td>{cost.mainClassification}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            <button
                type="button"
                className="btn btn-info mt-2"
                onClick={() => setShowIndirectModal(true)}
            >
                إضافة حساب تكاليف غير مباشرة
            </button>


            <button className="btn btn-primary ms-2 me-2" onClick={() => setShowFinalProducts(!showFinalProducts)}>
                {showFinalProducts ? "إخفاء المعاينة" : "معاينة"}
            </button>

            {showFinalProducts && (
                <div className="mt-4">
                    <h4>قائمة المنتجات النهائية</h4>

                    <Form.Control
                        type="text"
                        placeholder="🔍 ابحث باسم المنتج..."
                        className="mb-3 w-50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>اسم المنتج</th>
                                <th>الكود</th>
                                <th>الوحدة</th>
                                <th>المستودع</th>
                                <th>الصورة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {finalProducts
                                .filter(p =>
                                    p.name.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <button
                                                className="btn btn-link p-0 text-primary"
                                                onClick={() => {
                                                    setSelectedProduct(product);
                                                    setShowDetailsModal(true);
                                                }}
                                            >
                                                {product.name}
                                            </button>
                                        </td>
                                        <td>{product.code}</td>
                                        <td>{product.unit}</td>
                                        <td>
                                            {warehouses.find(w => w.id === product.warehouseId)?.name || "-"}
                                        </td>
                                        <td>
                                            <img
                                                src={product.imageUrl}
                                                alt="صورة المنتج"
                                                style={{
                                                    width: "120px",
                                                    height: "120px",
                                                    objectFit: "cover",
                                                    borderRadius: "6px"
                                                }}
                                            />

                                        </td>

                                    </tr>
                                ))}
                        </tbody>
                    </Table>

                </div>
            )}

            <Modal
                show={showDetailsModal}
                onHide={() => setShowDetailsModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>تفاصيل المنتج: {selectedProduct?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedProduct && (
                        <>
                            <p><strong>الكود:</strong> {selectedProduct.code}</p>
                            <p><strong>الوحدة:</strong> {selectedProduct.unit}</p>
                            <p><strong>الوصف:</strong> {selectedProduct.description}</p>
                            <p><strong>مدة الإنتاج:</strong> {selectedProduct.productionDurationHours} ساعة</p>
                            <hr />
                            <h5>المكونات</h5>
                            <Table bordered size="sm">
                                <thead>
                                    <tr>
                                        <th>اسم الصنف</th>
                                        <th>كود الصنف</th>
                                        <th>الكمية</th>
                                        <th>السعر</th>
                                        <th>تكلفة الوحدة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedProduct.components.map((c, i) => (
                                        <tr key={i}>
                                            <td>{c.name}</td>
                                            <td>{c.code}</td>
                                            <td>{c.quantity}</td>
                                            <td>{c.price}</td>
                                            <td>{(c.quantity * c.price).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            <div className="text-end mt-3">
                                <Button variant="success" onClick={() => window.print()}>
                                    🖨️ تحميل PDF
                                </Button>
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>
            <Modal show={showIndirectModal} onHide={() => setShowIndirectModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>إضافة تكاليف غير مباشرة</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="mb-3">
                        <Col>
                            <Form.Label>كود الحساب</Form.Label>
                            <Form.Control
                                value={indirectCostData.accountCode}
                                onChange={handleAccountCodeChange}
                                type="text"
                            />
                            {accountError && <small className="text-danger d-block">{accountError}</small>}
                        </Col>
                        <Col>
                            <Form.Label>اسم الحساب</Form.Label>
                            <Form.Control
                                value={indirectCostData.accountName}
                                onChange={(e) => setIndirectCostData({ ...indirectCostData, accountName: e.target.value })}
                                type="text"
                            />
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col>
                            <Form.Label>معيار التوزيع</Form.Label>
                            <Form.Control
                                value={indirectCostData.allocationBasis}
                                onChange={(e) => setIndirectCostData({ ...indirectCostData, allocationBasis: e.target.value })}
                                type="text"
                            />
                        </Col>
                        <Col>
                            <Form.Label>تكلفة الوحدة</Form.Label>
                            <Form.Control
                                value={indirectCostData.unitCost}
                                onChange={(e) => setIndirectCostData({ ...indirectCostData, unitCost: e.target.value })}
                                type="number"
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Form.Label>التصنيف الرئيسي</Form.Label>
                            <Form.Control
                                value={indirectCostData.mainClassification}
                                onChange={(e) => setIndirectCostData({ ...indirectCostData, mainClassification: e.target.value })}
                                type="text"
                            />
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowIndirectModal(false)}>
                        إلغاء
                    </Button>
                    <Button variant="primary" onClick={handleAddIndirectCost} disabled={!!accountError}>
                        حفظ الحساب
                    </Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
};

export default ProductForm;
