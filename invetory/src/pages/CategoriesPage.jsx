import { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

//const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState("");

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axiosInstance.get(`categories`);
            const data = response.data?.$values || [];  // ✅ التأكد من أن البيانات مسترجعة كمصفوفة
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
            setCategories([]);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory) return;
        try {
            await axiosInstance.post(`categories`, { name: newCategory });
            fetchCategories();  // 🔄 تحديث القائمة بعد الإضافة مباشرة
            setNewCategory("");
        } catch (error) {
            console.error("Error adding category:", error);
        }
    };

    return (
        <div className="container mt-4">
            <h2>الأصناف الرئيسية</h2>
            <div className="input-group mb-3">
                <input
                    type="text"
                    className="form-control"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="ادخل أسم التصنيف الرئيسي"
                />
                <button className="btn btn-primary me-2" onClick={handleAddCategory}>
                    إضافة
                </button>
            </div>

            <div className="list-group">
                {categories.length > 0 ? (
                    categories.map((category) => (
                        <div key={category.id} className="list-group-item">
                            {category.name} <span className="text-muted">(Category ID: {category.id})</span>
                        </div>
                    ))
                ) : (
                    <div className="alert alert-warning">لا توجد أصناف متاحة</div>
                )}
            </div>
        </div>
    );
}

export default CategoriesPage;
