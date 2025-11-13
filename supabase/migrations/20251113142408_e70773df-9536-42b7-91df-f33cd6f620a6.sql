-- Suppliers (fornecedores - pré-popular com 3 principais)
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    contact VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Clients (clientes com CPF/CNPJ para busca)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    cpf_cnpj VARCHAR(18) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Validação de formato CPF/CNPJ
ALTER TABLE clients
ADD CONSTRAINT chk_cpf_cnpj_format
CHECK (cpf_cnpj IS NULL OR cpf_cnpj ~ '^\d{11}$|^\d{14}$');

-- Accounts Payable (contas a pagar)
CREATE TABLE accounts_payable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    value DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT NOW(),
    payment_method VARCHAR(50) DEFAULT 'cash',
    due_date TIMESTAMP,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Accounts Receivable (contas a receber)
CREATE TABLE accounts_receivable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    gross_value DECIMAL(10,2) NOT NULL,
    net_value DECIMAL(10,2) NOT NULL,
    receipt_date TIMESTAMP DEFAULT NOW(),
    payment_method VARCHAR(50) DEFAULT 'cash',
    card_brand VARCHAR(50),
    tax_rate DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'received',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Trigger para calcular net_value automaticamente
CREATE OR REPLACE FUNCTION calculate_net_value()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_method = 'card' AND NEW.tax_rate IS NOT NULL THEN
        NEW.net_value := NEW.gross_value * (1 - NEW.tax_rate / 100);
    ELSE
        NEW.net_value := NEW.gross_value;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_net_value
    BEFORE INSERT OR UPDATE ON accounts_receivable
    FOR EACH ROW EXECUTE FUNCTION calculate_net_value();

-- Sales (vendas - hub para entradas detalhadas)
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accounts_receivable_id UUID UNIQUE REFERENCES accounts_receivable(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    sale_date TIMESTAMP DEFAULT NOW(),
    total_items INTEGER DEFAULT 0
);

-- Purchases (compras - hub para saídas detalhadas)
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accounts_payable_id UUID UNIQUE REFERENCES accounts_payable(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    purchase_date TIMESTAMP DEFAULT NOW(),
    total_items INTEGER DEFAULT 0
);

-- Sales Items (itens de venda - futuro)
CREATE TABLE sales_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(8,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- Purchase Items (itens de compra - futuro)
CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    input_id UUID,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(8,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- Índices para performance
CREATE INDEX idx_sales_client_id ON sales(client_id);
CREATE INDEX idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX idx_accounts_payable_supplier ON accounts_payable(supplier_id);
CREATE INDEX idx_accounts_receivable_client ON accounts_receivable(client_id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso completo para usuários autenticados)
CREATE POLICY "Authenticated users full access" ON suppliers
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users full access" ON clients
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users full access" ON accounts_payable
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users full access" ON accounts_receivable
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users full access" ON sales
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users full access" ON purchases
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users full access" ON sales_items
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users full access" ON purchase_items
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Inserir fornecedores padrão
INSERT INTO suppliers (name, contact) VALUES 
    ('Atacadão', 'contato@atacadao.com'),
    ('Makro', 'contato@makro.com'),
    ('Assaí', 'contato@assai.com');