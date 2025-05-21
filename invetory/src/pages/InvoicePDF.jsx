import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '../images/logo.png';
import { FaPhoneAlt, FaMapMarkerAlt, FaGlobe } from "react-icons/fa";

const InvoicePDF = () => {
    const location = useLocation();
    const {
        customer,
        items: rawItems = [],
        invoiceDate,
        orderNumber,
        salesRep,
    } = location.state || {};

    const initialItems = rawItems?.$values || rawItems;
    const [items, setItems] = useState(initialItems);

    const componentRef = useRef();

    const downloadPDF = () => {
        const input = componentRef.current;
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) downloadBtn.style.display = 'none';

        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save('عرض-سعر.pdf');

            if (downloadBtn) downloadBtn.style.display = 'block';
        });
    };

    useEffect(() => {
        downloadPDF();
    }, []);

    const handleDiscountChange = (index, value) => {
        const updated = [...items];
        updated[index].discount = parseFloat(value) || 0;
        setItems(updated);
    };

    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const totalDiscount = items.reduce((acc, item) => acc + (item.discount || 0), 0);
    const totalAfterDiscount = subtotal - totalDiscount;
    const tax = totalAfterDiscount * 0.15;
    const finalTotal = totalAfterDiscount + tax;

    if (!Array.isArray(items)) {
        return <div className="text-danger">❌ البيانات غير متوفرة بشكل صحيح</div>;
    }

    return (
        <div ref={componentRef} style={{ padding: '30px' }}>
            <style>
                {`
                table, th, td {
                    border: 2px solid black !important;
                }

                .table-bordered > thead > tr > th {
                    background-color: #d9d7d7;
                    color: black;
                    font-weight: bold;
                    text-align: center;
                }

                .table-bordered > tbody > tr > td {
                    background-color: #f9f9f9;
                }

                @media print {
                    table, th, td {
                        border: 2px solid black !important;
                    }

                    .table-bordered > thead > tr > th {
                        background-color: #555 !important;
                        color: white !important;
                    }

                    .table-bordered > tbody > tr > td {
                        background-color: #f9f9f9 !important;
                    }
                }
            `}
            </style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <table className="table table-bordered" style={{ width: '30%' }}>
                    <thead><tr><th colSpan="2">بيانات العميل</th></tr></thead>
                    <tbody>
                        <tr><td>الاسم</td><td>{customer.name}</td></tr>
                        <tr><td>العنوان</td><td>{customer.address}</td></tr>
                        <tr><td>رقم الجوال</td><td>{customer.contactInfo}</td></tr>
                    </tbody>
                </table>

                <div style={{ width: '30%', textAlign: 'center' }}>
                    <img src={logo} alt="Logo" style={{ width: '350px' }} />
                </div>

                <table className="table table-bordered" style={{ width: '30%' }}>
                    <thead><tr><th colSpan="2">شركة مصنع أريكة فرح</th></tr></thead>
                    <tbody>
                        <tr><td>تاريخ عرض السعر</td><td>{invoiceDate?.split("T")[0] || '—'}</td></tr>
                        <tr><td>رقم الطلب</td><td>{orderNumber || '—'}</td></tr>
                        <tr><td>المندوب</td><td>{salesRep || '—'}</td></tr>
                    </tbody>
                </table>
            </div>

            <h3 style={{ textAlign: 'center', margin: '30px 0' }}>عرض سعر</h3>

            <div style={{ marginTop: '10px', fontWeight: 'bold', fontSize: '15px' }}>
                السادة: ٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠
            </div>
            <div style={{ margin: '20px 0', fontWeight: 'bold', textAlign: 'center' }}>
                السلام عليكم ورحمة الله وبركاته ... يسعدنا أن نتقدم لكم بعرض السعر على النحو التالي:
            </div>

            <table className="table table-bordered text-center">
                <thead>
                    <tr>
                        <th>اسم المنتج</th>
                        <th>كود المنتج</th>
                        <th>الوصف</th>
                        <th>الكمية</th>
                        <th>السعر (للوحدة)</th>
                        <th>الخصم</th>
                        <th>الإجمالي بدون ضريبة</th>
                        <th>ضريبة القيمة المضافة (15%)</th>
                        <th>الإجمالي شامل الضريبة</th>
                        <th>صورة المنتج</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => {
                        const quantity = item.quantity || 0;
                        const unitPrice = item.price || 0;
                        const discount = item.discount || 0;

                        const priceWithoutDiscount = quantity * unitPrice;
                        const priceAfterDiscount = priceWithoutDiscount - discount;
                        const taxAmount = priceAfterDiscount * 0.15;
                        const totalWithTax = priceAfterDiscount + taxAmount;

                        let imageUrl = '';
                        if (item.drawing instanceof Blob) {
                            imageUrl = URL.createObjectURL(item.drawing);
                        } else if (typeof item.drawing === 'string' && item.drawing.startsWith('data:image')) {
                            imageUrl = item.drawing;
                        } else if (typeof item.drawing === 'string') {
                            imageUrl = `data:image/jpeg;base64,${item.drawing}`;
                        }

                        return (
                            <tr key={idx}>
                                <td>{item.productName || item.orderName || '—'}</td>
                                <td>{item.productCode || item.orderCode || item.product?.code || '—'}</td>
                                <td>{item.notes || '—'}</td>
                                <td>{quantity}</td>
                                <td>{unitPrice.toFixed(2)}</td>
                                <td>
                                    <input
                                        type="number"
                                        value={discount}
                                        onChange={(e) => handleDiscountChange(idx, e.target.value)}
                                        style={{ width: '70px' }}
                                    />
                                </td>
                                <td>{priceAfterDiscount.toFixed(2)}</td>
                                <td>{taxAmount.toFixed(2)}</td>
                                <td>{totalWithTax.toFixed(2)}</td>
                                <td>
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="منتج" style={{ width: '80px', height: '100px', objectFit: 'cover' }} />
                                    ) : '—'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <table className="table table-bordered w-50 ms-auto text-end">
                <tbody>
                    <tr><td><strong>الإجمالي بدون الضريبة:</strong></td><td>{subtotal.toFixed(2)}</td></tr>
                    <tr><td><strong>إجمالي الخصم:</strong></td><td>{totalDiscount.toFixed(2)}</td></tr>
                    <tr><td><strong>الإجمالي بعد الخصم :</strong></td><td>{(subtotal - totalDiscount).toFixed(2)}</td></tr>
                    <tr><td><strong>إجمالي الضريبة (15%):</strong></td><td>{tax.toFixed(2)}</td></tr>
                    <tr><td><strong>الإجمالي شامل الضريبة:</strong></td><td>{finalTotal.toFixed(2)}</td></tr>
                </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                <div style={{ width: '48%', fontSize: '13px', textAlign: 'right' }}>
                    <div style={{ background: '#d9d7d7', padding: '5px', fontWeight: 'bold', border: '1px solid #ccc' }}>الشروط والأحكام</div>
                    <ul style={{ listStyleType: '"* "', paddingRight: '20px', marginTop: '10px' }}>
                        <li>جميع الأسعار الواردة في عرض السعر صالحة لمدة ... يوم من تاريخ العرض</li>
                        <li>أي تعديلات يضيفها العميل في المواصفات قد يترتب عليها تعديلات في الأسعار</li>
                        <li>يتم إصدار الفاتورة بعد تسليم البضاعة</li>
                        <li>شروط وتاريخ الدفع : ...</li>
                        <li>على ان يتم البدء في الطلب بعد استلام اول دفعه او المبلغ كامل</li>
                        <li>و التسليم بعد استلام اخر دفعه او المبلغ كامل في فتره أقصاها ...</li>
                        <li>يتم الدفع عن طريق تحويل بنكي إلى الحسابات الرسمية للشركة:</li>
                    </ul>
                    <p style={{ marginRight: '25px' }}>بنك الأهلي السعودي:<br />رقم الحساب: 65700000848809<br />رقم الآيبان: SA5510000065700000848809</p>
                    <p style={{ marginRight: '25px' }}>بنك ساب:<br />رقم الحساب: 259180107001<br />رقم الآيبان: SA5745000000259180107001</p>
                    <p style={{ marginRight: '25px' }}>مصرف الراجحي:<br />رقم الحساب: 633000010006086088325<br />رقم الآيبان: SA8180000633608016088325</p>
                </div>

                <div style={{ width: '48%', fontSize: '13px', textAlign: 'right' }}>
                    <p><strong>للتواصل والاستفسارات :</strong></p>
                    <p><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><FaPhoneAlt /> 555555555555555</span></p>
                    <p><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><FaMapMarkerAlt /> جدة - مدينة الملك عبدالله الاقتصادية - الوادي الصناعي</span></p>
                    <p><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><FaGlobe /> <a href="https://www.arikafarah.com.sa" target="_blank" rel="noreferrer">www.arikafarah.com.sa</a></span></p>

                    <table className="table table-bordered mt-3 text-center">
                        <tbody>
                            <tr><td colSpan="2">يرجى تأكيد قبول عرض السعر للبدء في التنفيذ.</td></tr>
                            <tr>
                                <td style={{ width: '30%' }}>التوقيع:</td>
                                <td style={{ height: '80px' }}></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '20px' }}>
                <button id="downloadBtn" className="btn btn-danger" onClick={downloadPDF}>تحميل كـ PDF</button>
            </div>
        </div>
    );
};

export default InvoicePDF;
