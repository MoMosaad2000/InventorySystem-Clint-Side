import { useState, useEffect } from "react";

import axiosInstance from "../utils/axiosInstance";

//const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


function WarehousesPage() {
    const [warehouses, setWarehouses] = useState([]);
    const [newWarehouse, setNewWarehouse] = useState("");

    useEffect(() => {
        fetchWarehouses();
    }, []);
    const fetchWarehouses = async () => {
        try {
            const response = await axiosInstance.get(`warehouses`);
            const warehousesData = response.data?.$values || [];

            const updatedWarehouses = warehousesData.map(warehouse => ({
                ...warehouse,
                stocks: warehouse.stocks?.$values.map(stock => ({
                    ...stock,
                    product: stock.product || { id: stock.productId, name: "منتج غير معروف" }
                })) || []
            }));

            setWarehouses(updatedWarehouses);
        } catch (error) {
            console.error("Error fetching warehouses:", error);
            setWarehouses([]);
        }
    };



    const handleAddWarehouse = async () => {
        if (!newWarehouse) return;
        try {
            await axiosInstance.post(`warehouses`, { name: newWarehouse });
            fetchWarehouses();
            setNewWarehouse("");
        } catch (error) {
            console.error("Error adding warehouse:", error);
        }
    };

    return (
        <div className="container mt-4">
            <h2>المستودعات</h2>
            <div className="input-group mb-3">
                <input
                    type="text"
                    className="form-control"
                    value={newWarehouse}
                    onChange={(e) => setNewWarehouse(e.target.value)}
                    placeholder="أدخل اسم المستودع"
                />
                <button className="btn btn-primary me-2" onClick={handleAddWarehouse}>
                    إضافة مستودع
                </button>
            </div>

            <div className="list-group">
                {warehouses.length > 0 ? (
                    warehouses.map((warehouse) => (
                        <div key={warehouse.id} className="list-group-item">
                            <strong>{warehouse.name}</strong>
                            <ul>
                                {warehouse.stocks.length > 0 ? (
                                    warehouse.stocks.map((stock) => (
                                        <li key={stock.id || stock.productId}>
                                            📦 {stock.product?.name}  الكمية: {stock.quantity}
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-muted mt-2">🚫 لا توجد منتجات في هذا المستودع</li>
                                )}
                            </ul>
                        </div>
                    ))
                ) : (
                    <div className="alert alert-warning">⚠️ لا توجد مستودعات متاحة</div>
                )}
            </div>

        </div>
    );
}

export default WarehousesPage;
