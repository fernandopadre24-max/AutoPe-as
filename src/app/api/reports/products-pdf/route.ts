import { NextRequest, NextResponse } from 'next/server';

interface ReportData {
  title: string;
  date: string;
  products: Array<{
    sku: string;
    name: string;
    category: string;
    stock: number;
    minStock: number;
    unitPrice: string;
    totalValue: string;
    status: string;
  }>;
  summary: {
    totalProducts: number;
    totalValue: string;
    lowStockCount: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const reportData: ReportData = await request.json();

    // Simple HTML to PDF conversion using browser-like capabilities
    // In a production environment, you might want to use libraries like Puppeteer or jsPDF
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${reportData.title}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.4;
            color: #333;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .title { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .date { 
            font-size: 14px; 
            color: #666;
        }
        .summary { 
            margin: 20px 0; 
            padding: 15px; 
            background-color: #f5f5f5; 
            border-radius: 5px;
        }
        .summary-item {
            display: inline-block;
            margin-right: 30px;
            font-size: 14px;
        }
        .summary-label {
            font-weight: bold;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
            font-size: 12px;
        }
        th { 
            background-color: #f2f2f2; 
            font-weight: bold; 
        }
        .text-right { 
            text-align: right; 
        }
        .status-normal { 
            background-color: #d4edda; 
            color: #155724; 
            padding: 2px 6px; 
            border-radius: 3px;
            font-size: 10px;
        }
        .status-low { 
            background-color: #f8d7da; 
            color: #721c24; 
            padding: 2px 6px; 
            border-radius: 3px;
            font-size: 10px;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        .category-badge {
            background-color: #e3f2fd;
            color: #1976d2;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
        }
        @media print {
            body { margin: 10px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${reportData.title}</div>
        <div class="date">Data: ${reportData.date}</div>
    </div>

    <div class="summary">
        <div class="summary-item">
            <span class="summary-label">Total de Produtos:</span> ${reportData.summary.totalProducts}
        </div>
        <div class="summary-item">
            <span class="summary-label">Valor Total:</span> ${reportData.summary.totalValue}
        </div>
        <div class="summary-item">
            <span class="summary-label">Estoque Baixo:</span> ${reportData.summary.lowStockCount}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>SKU</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th class="text-right">Estoque</th>
                <th class="text-right">Estoque Mín</th>
                <th class="text-right">Preço Unit.</th>
                <th class="text-right">Valor Total</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${reportData.products.map(product => `
                <tr>
                    <td>${product.sku}</td>
                    <td>${product.name}</td>
                    <td><span class="category-badge">${product.category}</span></td>
                    <td class="text-right">${product.stock}</td>
                    <td class="text-right">${product.minStock}</td>
                    <td class="text-right">${product.unitPrice}</td>
                    <td class="text-right">${product.totalValue}</td>
                    <td>
                        <span class="${product.status === 'Normal' ? 'status-normal' : 'status-low'}">
                            ${product.status}
                        </span>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="footer">
        Relatório gerado em ${new Date().toLocaleString('pt-BR')}
    </div>
</body>
</html>`;

    // Return HTML as response with proper headers for PDF download
    // In production, you would convert this HTML to actual PDF
    // For now, we'll return it as HTML which browsers can print to PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="relatorio-produtos-${new Date().toISOString().split('T')[0]}.html"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    );
  }
}