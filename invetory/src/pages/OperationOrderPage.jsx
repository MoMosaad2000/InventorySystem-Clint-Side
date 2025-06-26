import  { useState, useEffect } from 'react';
import axiosInstance from "../utils/axiosInstance";
import { useNavigate } from 'react-router-dom';

const OperationOrder = () => {
    const [orderNumber, setOrderNumber] = useState('');
    const [orderData, setOrderData] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    // States
    const [showPreview, setShowPreview] = useState(false);
    const [searchOrderNumber, setSearchOrderNumber] = useState('');
    const [previewOrders, setPreviewOrders] = useState([]);

    // Toggle Preview Mode
    const handlePreview = () => {
        setShowPreview(true);
    };

    // Search and Fetch Order by Order Number
    const handleSearchOrder = async () => {
        try {
            const res = await axiosInstance.get(`/OperationOrder/${searchOrderNumber}`);
            const data = res.data;

            const items = Array.isArray(data.items)
                ? data.items
                : data.items?.$values || [];

            const mappedItems = items.map((item, idx) => ({
                itemNumber: idx + 1,
                productCode: item.productCode,
                productName: item.productName,
                unit: item.unit,
                quantity: item.quantity,
                productionDurationHours: item.productionDurationHours || 0,
                totalProductionHours: item.quantity * (item.productionDurationHours || 0),
            }));

            setPreviewOrders(prev => [
                ...prev,
                {
                    orderNumber: data.orderNumber,
                    items: mappedItems
                }
            ]);

            setSearchOrderNumber('');
        } catch (err) {
            alert('لم يتم العثور على أمر التشغيل!',err);
        }
    };


    useEffect(() => {
        if (orderNumber) {
            fetchSalesOrderData();
        } else {
            setOrderData(null);
            setProducts([]);
        }
    }, [orderNumber]);

    const fetchSalesOrderData = async () => {
        try {
            setLoading(true);
            setError('');

            // جلب بيانات أمر التشغيل من خلال orderNumber (وليس id)
            const operationOrderResponse = await axiosInstance.get(`/OperationOrder/${orderNumber}`);
            const data = operationOrderResponse.data;

            // تأكد أن items موجودة ومصفوفة
            const items = Array.isArray(data.items) ? data.items : data.items?.$values || [];

            // إعداد بيانات المنتجات
            const mappedItems = items.map((item, index) => {
                const totalProductionHours = item.quantity * (item.productionDurationHours || 0);

                return {
                    ...item,
                    itemNumber: index + 1,
                    totalProductionHours
                };
            });

            setOrderData({
                orderNumber: data.orderNumber,
                creationDate: data.creationDate,
                expirationDate: data.expirationDate,
                customerName: data.customerName,
                items: mappedItems
            });

            setProducts(mappedItems);

        } catch (err) {
            if (err.response?.status === 404) {
                setError('لم يتم العثور على أمر التشغيل. يرجى التحقق من رقم الأمر والمحاولة مرة أخرى.');
            } else {
                setError('حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.');
            }
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!orderData || products.length === 0) {
            setError('لا يوجد بيانات كافية لحفظ أمر التشغيل');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await axiosInstance.post('/OperationOrder', {
                orderNumber: orderData.orderNumber,
                creationDate: orderData.creationDate,
                customerName: orderData.customerName,
                expirationDate: orderData.expirationDate,
                items: products.map(product => ({
                    productName: product.productName,
                    productCode: product.productCode,
                    unit: product.unit,
                    quantity: product.quantity,
                    productionDurationHours: product.productionDurationHours,
                    totalProductionHours: product.totalProductionHours
                }))
            });

            alert('تم حفظ أمر التشغيل بنجاح!');
            navigate('/operation-orders');

        } catch (err) {
            let errorMessage = 'حدث خطأ أثناء حفظ البيانات';

            if (err.response) {
                if (err.response.status === 404) {
                    errorMessage = 'لم يتم العثور على المسار المطلوب';
                } else if (err.response.status === 400) {
                    errorMessage = 'بيانات غير صالحة: ' + (err.response.data?.message || '');
                } else if (err.response.status === 500) {
                    errorMessage = 'خطأ في الخادم الداخلي';
                }
            } else if (err.request) {
                errorMessage = 'لا يوجد اتصال بالخادم';
            }

            setError(errorMessage);
            console.error('Error saving operation order:', err);
        } finally {
            setLoading(false);
        }
    };
    //const handlePreview = () => {
    //    alert('تمت معاينة البيانات بنجاح!');
    //};

    const calculateTotals = () => {
        const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);
        const totalHours = products.reduce((sum, product) => sum + product.totalProductionHours, 0);
        return { totalQuantity, totalHours };
    };

    const totals = calculateTotals();

    return (
        <div className="container mt-4">
            <h2 className="mb-4 text-center">أوامر التشغيل</h2>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card shadow">
                <div className="card-header bg-primary text-white">
                    <h4>بيانات الأمر</h4>
                </div>

                <div className="card-body">
                    <div className="row mb-4">
                        <div className="col-md-3">
                            <label className="form-label">رقم الأمر</label>
                            <input
                                type="text"
                                className="form-control"
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value)}
                                placeholder="أدخل رقم الأمر"
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label">اسم العميل</label>
                            <input
                                type="text"
                                className="form-control"
                                value={orderData?.customerName || ''}
                                readOnly
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label">تاريخ الأمر</label>
                            <input
                                type="text"
                                className="form-control"
                                value={orderData?.creationDate ? new Date(orderData.creationDate).toLocaleDateString() : ''}
                                readOnly
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label">تاريخ الاستلام</label>
                            <input
                                type="text"
                                className="form-control"
                                value={orderData?.expirationDate ? new Date(orderData.expirationDate).toLocaleDateString() : ''}
                                readOnly
                            />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-bordered table-striped">
                            <thead className="table-dark">
                                <tr>
                                    <th>رقم البند في طلب العميل</th>
                                    <th>كود المنتج</th>
                                    <th>اسم المنتج</th>
                                    <th>الوحدة</th>
                                    <th>الكمية</th>
                                    <th>عدد ساعات التشغيل للوحدة</th>
                                    <th>الإجمالي (ساعات)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length > 0 ? (
                                    products.map((product, index) => (
                                        <tr key={index}>
                                            <td>{product.itemNumber}</td>
                                            <td>{product.productCode}</td>
                                            <td>{product.productName}</td>
                                            <td>{product.unit}</td>
                                            <td>{product.quantity}</td>
                                            <td>{product.productionDurationHours}</td>
                                            <td>{product.totalProductionHours}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center">لا توجد منتجات</td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="4" className="text-end fw-bold">الإجمالي</td>
                                    <td className="fw-bold">{totals.totalQuantity}</td>
                                    <td></td>
                                    <td className="fw-bold">{totals.totalHours}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div className="d-flex justify-content-end mt-3">
                        <button
                            className="btn btn-secondary me-2 ms-2"
                            onClick={handlePreview}
                        >
                            <i className="bi bi-eye-fill me-1"></i> معاينة
                        </button>

                        <button
                            className="btn btn-success  "
                            onClick={handleSubmit}
                            disabled={!orderData || loading || products.length === 0}
                        >
                            {loading ? (
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            ) : (
                                <i className="bi bi-save-fill me-1"></i>
                            )}
                            حفظ
                        </button>
                    </div>

                    {showPreview && (
                        <div className="mt-5">
                            <h5 className="mb-3">🔍 البحث عن أمر تشغيل</h5>
                            <div className="input-group mb-4">
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="ادخل رقم أمر التشغيل"
                                    value={searchOrderNumber}
                                    onChange={(e) => setSearchOrderNumber(e.target.value)}
                                />
                                <button className="btn btn-primary" onClick={handleSearchOrder}>
                                    بحث
                                </button>
                            </div>

                            {previewOrders.map((order, idx) => (
                                <div key={idx} className="mb-4">
                                    <h6 className="text-primary">أمر تشغيل رقم: {order.orderNumber}</h6>
                                    <div className="table-responsive">
                                        <table className="table table-bordered text-center">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>رقم أمر التشغيل</th>
                                                    <th>رقم البند في طلب العميل</th>
                                                    <th>كود المنتج</th>
                                                    <th>اسم المنتج</th>
                                                    <th>الوحدة</th>
                                                    <th>الكمية</th>
                                                    <th>عدد ساعات التشغيل للوحدة</th>
                                                    <th>الإجمالي (ساعات)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.items.map((item, i) => (
                                                    <tr key={i}>
                                                        <td>{order.orderNumber}</td>
                                                        <td>{item.itemNumber}</td>
                                                        <td>{item.productCode}</td>
                                                        <td>{item.productName}</td>
                                                        <td>{item.unit}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>{item.productionDurationHours}</td>
                                                        <td>{item.totalProductionHours}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default OperationOrder;