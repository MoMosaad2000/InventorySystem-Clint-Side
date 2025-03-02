import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://inventory2025.runasp.net/api/";


function SubCategoriesPage() {
    const [categories, setCategories] = useState([]);  // ✅ لتحميل قائمة الفئات الرئيسية
    const [subCategories, setSubCategories] = useState([]);
    const [newSubCategory, setNewSubCategory] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");  // ✅ اختيار فئة للصب كاتيجوري الجديد

    useEffect(() => {
        fetchCategories();
        fetchSubCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}categories`);
            const data = response.data?.$values || [];
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
            setCategories([]);
        }
    };

    const fetchSubCategories = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}subcategories`);
            const data = response.data?.$values || [];
            setSubCategories(data);
        } catch (error) {
            console.error("Error fetching subcategories:", error);
            setSubCategories([]);
        }
    };

    const handleAddSubCategory = async () => {
        if (!newSubCategory || !selectedCategory) return;
        try {
            await axios.post(`${API_BASE_URL}subcategories`, { name: newSubCategory, categoryId: selectedCategory });
            fetchSubCategories();
            setNewSubCategory("");
        } catch (error) {
            console.error("Error adding subcategory:", error);
        }
    };

    return (
        <div className="container mt-4">
            <h2>التصنيف الرئيسي</h2>

            {/* 🟢 اختيار الفئة الرئيسية */}
            <div className="mb-3">
                <label>أختر التصنيف الرئيسي </label>
                <select
                    className="form-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="">-- أختر تصنيف رئيسي --</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* 🟢 إدخال الصب كاتيجوري */}
            <div className="input-group mb-3">
                <input
                    type="text"
                    className="form-control"
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value)}
                    placeholder="أدخل اسم التصنيف الفرعي"
                />
                <button className="btn btn-primary me-2" onClick={handleAddSubCategory}>
                    إضافة
                </button>
            </div>

            {/* 🟢 عرض قائمة الصب كاتيجوري */}
            <div className="list-group">
                {subCategories.length > 0 ? (
                    subCategories.map((subCategory) => (
                        <div key={subCategory.id} className="list-group-item">
                            {subCategory.name} <span className="text-muted">(Category ID: {subCategory.categoryId})</span>
                        </div>
                    ))
                ) : (
                    <div className="alert alert-warning">لا أصناف فرعيه متاحة</div>
                )}
            </div>

        </div>
    );
}

export default SubCategoriesPage;
