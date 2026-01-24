// Criar ícones básicos para Loja2026 PDV
const fs = require('fs');
const path = require('path');

// Criar ícones SVG básicos
const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size/8}" fill="#6366F1"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size/4}" font-weight="bold">PDV</text>
</svg>
`;

// Criar ícones PNG básicos
const createPNGIcon = (size, filename) => {
  const svgContent = createSVGIcon(size);
  
  // Criar arquivo SVG temporário
  const svgPath = path.join(process.cwd(), 'src-tauri/build', 'temp-icon.svg');
  fs.writeFileSync(svgPath, svgContent);
  
  console.log(`✅ Ícone SVG criado: ${filename} (${size}x${size})`);
  console.log(`⚠  Para PNG: Use ferramenta externa ou designer profissional`);
  
  return true;
};

// Criar ícones para diferentes tamanhos
const icons = [
  { size: 32, filename: '32x32.png' },
  { size: 128, filename: '128x128.png' },
  { size: 256, filename: '128x128@2x.png' },
  { size: 512, filename: '512x512.png' }
];

console.log('🎨 Criando ícones básicos para Loja2026 PDV...');

if (!fs.existsSync(path.join(process.cwd(), 'src-tauri', 'build'))) {
  fs.mkdirSync(path.join(process.cwd(), 'src-tauri', 'build'), { recursive: true });
}

icons.forEach(icon => {
  createPNGIcon(icon.size, icon.filename);
});

// Criar README para os ícones
const iconReadme = `# Ícones Loja2026 PDV

Esta pasta contém os ícones básicos criados automaticamente.

## Ícones Gerados:
${icons.map(icon => `- ${icon.filename} (${icon.size}x${icon.size})`).join('\n')}

## Como Melhorar os Ícones:

1. **Usar Designer Profissional**: Contrate um designer para criar ícones profissionais
2. **Múltiplas Variações**: Crie ícones para diferentes tamanhos e temas
3. **Formatos Adicionais**: 
   - Windows: .ico (múltiplas resoluções)
   - macOS: .icns 
   - Linux: .png (múltiplos tamanhos)
4. **Testar Visualmente**: Verifique como ficam em diferentes fundos
5. **Brand Guidelines**: Mantenha consistência com a identidade visual da marca

## Geração Automática:

Para gerar ícones automaticamente usando ferramentas profissionais:

bash
# Com ferramentas online
# - https://www.favicon.io/
# - https://canva.com/
# - https://www.flaticon.com/packs/interface/

## Estrutura Final Esperada:

src-tauri/build/icons/
├── 32x32.png
├── 64x64.png
├── 128x128.png
├── 256x256.png
├── 512x512.png
├── 1024x1024.png
├── icon.ico (Windows)
├── icon.icns (macOS)
└── icon.png (fallback)

## Próximo Passo:

1. Usar ferramenta online (favicon.io) para gerar ícones profissionais
2. Substituir os ícones gerados automaticamente
3. Testar visualmente

Comandos úteis:

# Favicon.io
# Copiar e colar este conteúdo no browser: https://realfavicgenerator.com/
# Text: PDV
# Background: #6366F1
# Cor do texto: Branco
`;

fs.writeFileSync(path.join(process.cwd(), 'src-tauri/build/icons/README.md'), iconReadme);

console.log('✅ Estrutura de ícones criada com sucesso!');
console.log('📋 Consulte src-tauri/build/icons/README.md para detalhes');
console.log('🎨 Próximo passo: Usar ferramenta online para gerar ícones profissionais');
console.log('🌐 Recomendado: https://favicon.io/app');