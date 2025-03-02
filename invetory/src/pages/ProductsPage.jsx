import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://inventory2025.runasp.net/api/";


function ProductsPage() {
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [selectedWarehouse, setSelectedWarehouse] = useState("");
    const [showProducts, setShowProducts] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: "",
        code: "",
        description: "",
        unit: "حبة",
        imageUrl: "",
        subCategoryId: "",
    });

    useEffect(() => {
        fetchCategories();
        fetchWarehouses();
        fetchProducts();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            fetchSubCategories(selectedCategory);
        }
    }, [selectedCategory]);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}categories`);
            setCategories(response.data?.$values || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
            setCategories([]);
        }
    };

    const fetchSubCategories = async (categoryId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}subcategories?categoryId=${categoryId}`);
            setSubCategories(response.data?.$values || []);
        } catch (error) {
            console.error("Error fetching subcategories:", error);
            setSubCategories([]);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}products`);
            setProducts(response.data?.$values || []);
        } catch (error) {
            console.error("Error fetching products:", error);
            setProducts([]);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}warehouses`);
            setWarehouses(response.data?.$values || []);
        } catch (error) {
            console.error("Error fetching warehouses:", error);
            setWarehouses([]);
        }
    };

    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.code || !selectedSubCategory || !selectedWarehouse) {
            alert("⚠️ يرجى ملء جميع الحقول المطلوبة.");
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}products`, {
                name: newProduct.name,
                code: newProduct.code,
                description: newProduct.description || "",
                unit: newProduct.unit,
                imageUrl: newProduct.imageUrl || "",
                subCategoryId: parseInt(selectedSubCategory),
                warehouseId: parseInt(selectedWarehouse) // ✅ إرسال `warehouseId` فقط
            });

            if (response.status === 201) {
                console.log("✅ المنتج أُضيف بنجاح:", response.data);

                fetchProducts(); // ✅ تحديث المنتجات بعد الإضافة
                fetchWarehouses(); // ✅ تحديث المستودعات بعد الإضافة

                setNewProduct({
                    name: "",
                    code: "",
                    description: "",
                    unit: "حبة",
                    imageUrl: "",
                    subCategoryId: "",
                });

                alert(`✅ المنتج "${newProduct.name}" أُضيف بنجاح إلى المستودع!`);
            }
        } catch (error) {
            console.error("❌ خطأ عند إضافة المنتج:", error.response?.data || error.message);
            alert("⚠️ فشل في إضافة المنتج. تأكد من صحة البيانات المدخلة.");
        }
    };

    return (
        <div className="container mt-4">
            <h2>إضافة منتج</h2>
            <div className="row mb-3">
                <div className="col">
                    <label>التصنيف الرئيسي:</label>
                    <select className="form-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        <option value="">أختر التنصيف الرئيسي </option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col">
                    <label>التصنيف الفرعي:</label>
                    <select className="form-select" value={selectedSubCategory} onChange={(e) => setSelectedSubCategory(e.target.value)}>
                        <option value="">أختر التصنيف الفرعي  </option>
                        {subCategories.map((subCategory) => (
                            <option key={subCategory.id} value={subCategory.id}>
                                {subCategory.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="row mb-3">
                <div className="col">
                    <label>أسم الصنف:</label>
                    <input type="text" className="form-control" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                </div>
                <div className="col">
                    <label>الباركود:</label>
                    <input type="text" className="form-control" value={newProduct.code} onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })} />
                </div>
            </div>
            <div className="row mb-3">
                <div className="col">
                    <label>الوصف:</label>
                    <input type="text" className="form-control" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
                </div>
                <div className="col">
                    <label>الوحدة:</label>
                    <select className="form-select" value={newProduct.unit} onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}>
                        <option value="حبة">حبة</option>
                        <option value="كرتونة">كرتونة</option>
                        <option value="كيلو">كيلو</option>
                        <option value="لوح">لوح</option>
                    </select>
                </div>
            </div>
            <div className="row mb-3">
                <div className="col">
                    <label>رابط الصورة:</label>
                    <input type="text" className="form-control" value={newProduct.imageUrl} onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })} />
                </div>
                <div className="col">
                    <label>المستودع:</label>
                    <select className="form-select" value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)}>
                        <option value="">أختر مستودع </option>
                        {warehouses.map((warehouse) => (
                            <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <button className="btn btn-success me-2" onClick={handleAddProduct}>إضافة صنف </button>
            <button className="btn btn-primary ms-2 me-2" onClick={() => setShowProducts(!showProducts)}>معاينة</button>

            {showProducts && (
                <div className="mt-4">
                    <h2>قائمة الأصناف</h2>
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>اسم الصنف</th>
                                <th>كود الصنف</th>
                                <th>وحدة</th>
                                <th>مستودع رقم</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td>{product.name}</td>
                                    <td>{product.code}</td>
                                    <td>{product.unit}</td>
                                    <td>{product.warehouseId}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ProductsPage;
