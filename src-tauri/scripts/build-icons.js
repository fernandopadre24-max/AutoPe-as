#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🎨 Gerando ícones para build...');

try {
  // Verificar se existe ImageMagick
  execSync('magick --version', { stdio: 'pipe' });
  
  // Gerar ícones em múltiplos tamanhos
  const sizes = [16, 32, 48, 64, 128, 256, 512];
  const iconPath = './build/icons';
  
  if (!fs.existsSync(iconPath)) {
    fs.mkdirSync(iconPath, { recursive: true });
  }
  
  sizes.forEach(size => {
    const command = `magick -background "#6366F1" -fill white -font "DejaVu Sans Bold" -size ${size/2} -gravity center "PDV" -extent ${size}x${size} ${iconPath}/icon-${size}.png`;
    console.log(`Gerando ícone ${size}x${size}...`);
    execSync(command);
  });
  
  // Gerar ícone para Windows (.ico)
  console.log('Gerando icon.ico para Windows...');
  const icoCommand = 'magick convert ./build/icons/icon-256.png ./build/icons/icon-16.png ./build/icons/icon-32.png ./build/icons/icon-48.png ./build/icons/icon.ico';
  execSync(icoCommand);
  
  console.log('✅ Ícones gerados com sucesso!');
  
} catch (error) {
  console.log('⚠ ImageMagick não encontrado. Usando placeholder...');
  console.log('💡 Instale ImageMagick: brew install imagemagick');
  console.log('💡 Ou use ferramenta online: https://favicon.io/');
  
  // Criar placeholders
  const placeholderContent = '<!-- Ícone placeholder -- substitua com ícone real -->';
  sizes.forEach(size => {
    const placeholderPath = `${iconPath}/icon-${size}.png`;
    if (!fs.existsSync(placeholderPath)) {
      fs.writeFileSync(placeholderPath, placeholderContent);
    }
  });
}

console.log('🔧 Configurando build para Tauri...');
createBuildConfig();
createIconBuildScript();
