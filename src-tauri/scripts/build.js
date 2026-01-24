// build.js - Script de build para Tauri
const fs = require('fs');
const path = require('path');

const createBuildConfig = () => {
  const config = {
    build: {
      beforeBuildCommand: 'npm run build',
      beforeDevCommand: 'npm run dev',
      devUrl: 'http://localhost:9002',
      frontendDist: '../dist',
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'tauri.conf.json'),
    JSON.stringify(config, null, 2)
  );
  
  console.log('✅ Configuração de build atualizada');
};

const createIconBuildScript = () => {
  const iconPath = './build/icons';
  
  if (!fs.existsSync(iconPath)) {
    fs.mkdirSync(iconPath, { recursive: true });
  }
  
  // Criar placeholders básicos
  const placeholderContent = '<!-- Ícone Loja2026 PDV -- Substitua com ícone real -->';
  const sizes = [16, 32, 48, 64, 128, 256, 512];
  
  sizes.forEach(size => {
    const placeholderPath = `${iconPath}/icon-${size}.png`;
    fs.writeFileSync(placeholderPath, placeholderContent);
  });
  
  console.log('✅ Placeholders para ícones criados');
  console.log('🎨 Use https://favicon.io/ para gerar ícones profissionais');
};

const createPackageJSONScripts = () => {
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  // Ler package.json existente ou criar novo
  let packageContent;
  try {
    packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch {
    // Criar package.json básico se não existir
    packageContent = {
      name: 'loja2026-pdv-tauri',
      version: '1.0.0',
      scripts: {}
    };
  }
  
  const scripts = {
    ...packageContent.scripts,
    'tauri': 'tauri dev',
    'build': 'tauri build',
    'build:tauri': 'npm run build && tauri build',
    'dist': 'tauri build',
    'icons': 'node src-tauri/scripts/build-icons.js'
  };
  
  packageContent.scripts = scripts;
  fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2));
  
  console.log('✅ Scripts Tauri configurados!');
};

// Executar funções
console.log('🚀 Configurando ambiente de build Tauri...');
createBuildConfig();
createIconBuildScript();
createPackageJSONScripts();

console.log('🎯 Setup do Tauri concluído com sucesso!');
console.log('');
console.log('📋 Scripts disponíveis:');
console.log('  npm run tauri      # Iniciar desenvolvimento');
console.log('  npm run build        # Build frontend');
console.log('  npm run build:tauri # Build aplicação desktop');
console.log('  npm run icons       # Gerar ícones');
console.log('');
console.log('🎨 Recomendado: Use https://favicon.io/ para gerar ícones profissionais');