﻿import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import WarehousesPage from "./pages/WarehousesPage";
import CategoriesPage from "./pages/CategoriesPage";
import SubCategoriesPage from "./pages/SubCategoriesPage";
import ProductsPage from "./pages/ProductsPage";
import StockTransfer from "./pages/StockTransfer";
import StockInVoucherPage from "./pages/StockInVoucherPage";
import StockOutVoucherPage from "./pages/StockOutVoucher";
import PurchaseInvoicePage from "./pages/PurchaseInvoicePage ";

// استيراد Bootstrap إذا كنت تستخدمه
import "bootstrap/dist/css/bootstrap.min.css";
// استيراد ملف التنسيقات الخاص بنا
import "./App.css";

function App() {
    return (
        <Router>
            {/* حاوية رئيسية */}
            <div className="container my-app-container">
                <h2 className="app-title">سيستم إدارة مخزون</h2>

                {/* قائمة تنقل علوية */}
                <nav>
                    <ul className="nav app-nav">
                        <li className="nav-item">
                            <Link className="nav-link" to="/">
                                المستودعات
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/categories">
                                الأصناف الرئيسية
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/subcategories">
                                الأصناف الفرعية
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/products">
                                تكويد الصنف
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/stock-transfer">
                                تحويلات مخزنية
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/stock-in-voucher">
                                سند إضافة
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/stock-out-voucher">
                                سند صرف
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/purchase-in-voice">
                                فاتورة مشتريات
                            </Link>
                        </li>
                    </ul>
                </nav>


                {/* تعريف المسارات */}
                <main className="app-main">
                    <Routes>
                        <Route path="/" element={<WarehousesPage />} />
                        <Route path="/categories" element={<CategoriesPage />} />
                        <Route path="/subcategories" element={<SubCategoriesPage />} />
                        <Route path="/products" element={<ProductsPage />} />
                        <Route path="/stock-transfer" element={<StockTransfer />} />
                        <Route path="/stock-in-voucher" element={<StockInVoucherPage />} />
                        <Route path="/stock-out-voucher" element={<StockOutVoucherPage />} />
                        <Route path="/purchase-in-voice" element={<PurchaseInvoicePage />} />
                    </Routes>
                </main>
                <footer className="app-footer">
                    <p>حقوق النشر محفوظة لدي شركة مصنع أريكة فرح © 2025</p>
                </footer>
            </div>
        </Router>
    );
}

export default App;
