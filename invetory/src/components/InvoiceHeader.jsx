import styled from 'styled-components';
import logo from '../images/logo.png';

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  border-bottom: 2px solid #ccc;
  padding-bottom: 15px;
  margin-bottom: 20px;
  direction: ltr;
`;

const Section = styled.div`
  flex: 1;
  text-align: ${(props) => props.align};
  direction: ${(props) => (props.rtl ? 'rtl' : 'ltr')};
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

h4 {
  margin-bottom: 10px;
  font-weight: bold;
  font-size: 16px;
  text-align: ${(props) => props.align}; 
}


  p {
    margin: 4px 0;
    font-size: 13px;
  }
`;


const LogoContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: 150px;
    height: auto;
  }
`;

const InvoiceHeader = () => (
    <HeaderContainer>
        <Section align="left">
            <p><strong>Farah Sofa Factory Co.</strong></p>

            <p>Furniture and Air Duct Industry</p>
            <p>Jeddah - King Abdullah City - Industrial Valley</p>
            <p>Tel/Fax: 05371111112</p>
            <p>VAT: SA0000000000000</p>
            <p>Record Num: 0000000</p>
        </Section>

        <LogoContainer>
            <img src={logo} alt="Factory Logo" />
        </LogoContainer>

        <Section align="right" rtl>
            <h4>شركة مصنع أريكة فرح للصناعة</h4>
            <p>صناعة الأثاث ومجاري الهواء</p>
            <p>جدة - مدينة الملك عبدالله - الوادي الصناعي</p>
            <p>هاتف/فاكس: 05371111112</p>
            <p>الرقم الضريبي: SA0000000000000</p>
            <p> السجل التجاري: 0000000  </p>
        </Section>
    </HeaderContainer>
);

export default InvoiceHeader;
