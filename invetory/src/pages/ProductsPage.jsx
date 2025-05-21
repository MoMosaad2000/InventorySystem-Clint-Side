import { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { FaPaperclip } from "react-icons/fa";

//const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function ProductsPage() {
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [selectedWarehouse, setSelectedWarehouse] = useState("");
    const [showProducts, setShowProducts] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [newProduct, setNewProduct] = useState({
        name: "",
        code: "",
        description: "",
        unit: "",
        subCategoryId: "",
        colorCode: ""
    });
    const [codeExists, setCodeExists] = useState(false);

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
            const response = await axiosInstance.get(`categories`);
            setCategories(response.data?.$values || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchSubCategories = async (categoryId) => {
        try {
            const response = await axiosInstance.get(`subcategories?categoryId=${categoryId}`);
            setSubCategories(response.data?.$values || []);
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

    const fetchWarehouses = async () => {
        try {
            const response = await axiosInstance.get(`warehouses`);
            setWarehouses(response.data?.$values || []);
        } catch (error) {
            console.error("Error fetching warehouses:", error);
        }
    };

    const handleCodeChange = (value) => {
        setNewProduct({ ...newProduct, code: value });
        const exists = products.some(p => p.code === value);
        setCodeExists(exists);
    };

    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.code || !selectedSubCategory || !selectedWarehouse) {
            alert("⚠️ يرجى ملء جميع الحقول المطلوبة.");
            return;
        }
        if (codeExists) {
            alert("⚠️ كود الصنف مستخدم من قبل!");
            return;
        }

        const formData = new FormData();
        const productData = {
            name: newProduct.name,
            code: newProduct.code,
            description: newProduct.description,
            unit: newProduct.unit,
            subCategoryId: parseInt(selectedSubCategory),
            warehouseId: parseInt(selectedWarehouse),
            colorCode: newProduct.colorCode
        };

        formData.append("product", JSON.stringify(productData));
        if (imageFile) formData.append("image", imageFile);

        try {
            const response = await axiosInstance.post(`products/upload`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (response.status === 201) {
                fetchProducts();
                fetchWarehouses();
                setNewProduct({ name: "", code: "", description: "", unit: "حبة", subCategoryId: "", colorCode: "" });
                setImageFile(null);
                alert(`✅ المنتج "${productData.name}" أُضيف بنجاح!`);
            }
        } catch (error) {
            console.error("❌ خطأ عند إضافة المنتج:", error.response?.data || error.message);
            alert("⚠️ فشل في إضافة المنتج.");
        }
    };

    return (
        <div className="container mt-4">
            <h2>إضافة صنف</h2>
            <div className="row mb-3">
                <div className="col">
                    <label>التصنيف الرئيسي:</label>
                    <select className="form-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        <option value="">أختر التصنيف الرئيسي</option>
                        {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                </div>
                <div className="col">
                    <label>التصنيف الفرعي:</label>
                    <select className="form-select" value={selectedSubCategory} onChange={(e) => setSelectedSubCategory(e.target.value)}>
                        <option value="">أختر التصنيف الفرعي</option>
                        {subCategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
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
                    <input type="text" className={`form-control ${codeExists ? "is-invalid" : ""}`}
                     value={newProduct.code} onChange={(e) => handleCodeChange(e.target.value)} />
                    {codeExists && <div className="invalid-feedback">⚠️ هذا الكود مستخدم بالفعل!</div>}
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
                        <option value="متر">متر</option>
                    </select>
                </div>
            </div>
            <div className="row mb-3">
                <div className="col">
                    <label>ملف الصنف:</label>
                    <input type="file" className="form-control" onChange={(e) => setImageFile(e.target.files[0])} />
                </div>
                <div className="col">
                    <label>اسم الملف المرفق:</label>
                    <input type="text" className="form-control" value={imageFile?.name || ""} readOnly />
                </div>
                <div className="col">
                    <label>كود اللون:</label>
                    <input type="text" className="form-control" placeholder="مثال: #FF5733" value={newProduct.colorCode} onChange={(e) => setNewProduct({ ...newProduct, colorCode: e.target.value })} />
                </div>
            </div>
            <div className="row mb-3">
                <div className="col">
                    <label>المستودع:</label>
                    <select className="form-select" value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)}>
                        <option value="">أختر مستودع</option>
                        {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                    </select>
                </div>
            </div>
            <button className="btn btn-success me-2" onClick={handleAddProduct}>إضافة صنف</button>
            <button className="btn btn-primary ms-2 me-2" onClick={() => setShowProducts(!showProducts)}>معاينة</button>
            {showProducts && (
                <div className="mt-4">
                    <h2>قائمة الأصناف</h2>
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>اسم الصنف</th>
                                <th>كود الصنف</th>
                                <th>الوحدة</th>
                                <th>كود اللون</th>
                                <th>مستودع</th>
                                <th>المرفق</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id}>
                                    <td>{product.name}</td>
                                    <td>{product.code}</td>
                                    <td>{product.unit}</td>
                                    <td>{product.colorCode}</td>
                                    <td>{product.warehouseId}</td>
                                    <td>
                                        {product.imageUrl ? (
                                            <a href={product.imageUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-light">
                                                <FaPaperclip />
                                            </a>
                                        ) : "-"}
                                    </td>
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

