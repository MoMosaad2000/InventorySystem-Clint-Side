import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import WarehousesPage from "./pages/WarehousesPage";
import CategoriesPage from "./pages/CategoriesPage";
import SubCategoriesPage from "./pages/SubCategoriesPage";
import ProductsPage from "./pages/ProductsPage";
import StockTransfer from "./pages/StockTransfer";
import StockInVoucherPage from "./pages/StockInVoucherPage";
import StockOutVoucherPage from "./pages/StockOutVoucher";
import PurchaseInvoicePage from "./pages/PurchaseInvoicePage ";
import WarehouseReport from "./pages/WarehouseReport";
import StockReport from "./pages/StockReport";
import SalesOrderPage from "./pages/SalesOrderPage";
import InventoryReport from "./pages/InventoryReport";
import PurchaseReportPage from "./pages/PurchaseReportPage";
import InvoicePDF from "./pages/InvoicePDF";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
    return (
        <Router>
            <div className="container my-app-container">
                <nav>
                    <ul className="nav app-nav">
                        <li className="nav-item"><Link className="nav-link" to="/">المستودعات</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/categories">الأصناف الرئيسية</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/subcategories">الأصناف الفرعية</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/products">تكويد الصنف</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/stock-transfer">تحويلات مخزنية</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/stock-in-voucher">سند إضافة</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/stock-out-voucher">سند صرف</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/purchase-in-voice">فاتورة مشتريات</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/Stock-report">تقرير الصنف</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/Warehouse-report">تقرير المخزن</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/Inventory-report">تقرير جرد المخزن</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/Purchase-report">تقرير مشتريات</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/Sales-Order">أمر بيع</Link></li>
                    </ul>
                </nav>

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
                        <Route path="/Stock-report" element={<StockReport />} />
                        <Route path="/Warehouse-report" element={<WarehouseReport />} />
                        <Route path="/Inventory-report" element={<InventoryReport />} />
                        <Route path="/Purchase-report" element={<PurchaseReportPage />} />
                        <Route path="/Sales-Order" element={<SalesOrderPage />} />
                        <Route path="/invoice-pdf" element={<InvoicePDF />} />
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
