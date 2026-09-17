const { build } = require('vite');
const { viteSingleFile } = require('vite-plugin-singlefile');
const { resolve } = require('path');
const fs = require('fs');

async function run() {
  const rootDir = 'D:\\Xiao的个人站';
  
  // 1. Build index.html
  await build({
    root: rootDir,
    base: './',
    plugins: [viteSingleFile()],
    build: {
      outDir: resolve(rootDir, 'dist'),
      emptyOutDir: false,
      rollupOptions: {
        input: resolve(rootDir, 'index.html'),
      }
    }
  });

  // 2. Build admin.html
  await build({
    root: rootDir,
    base: './',
    plugins: [viteSingleFile()],
    build: {
      outDir: resolve(rootDir, 'dist'),
      emptyOutDir: false,
      rollupOptions: {
        input: resolve(rootDir, 'admin.html'),
      }
    }
  });

  // 3. Export to standalone offline files
  const indexPath = resolve(rootDir, 'dist', 'index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf-8');
  fs.writeFileSync(
    resolve(rootDir, '单文件纯离线版-前台.html'),
    indexHtml.replace('<script type="module" crossorigin>', '<script>'),
    'utf-8'
  );

  const adminPath = resolve(rootDir, 'dist', 'admin.html');
  const adminHtml = fs.readFileSync(adminPath, 'utf-8');
  fs.writeFileSync(
    resolve(rootDir, '单文件纯离线版-后台管理.html'),
    adminHtml.replace('<script type="module" crossorigin>', '<script>'),
    'utf-8'
  );

  console.log('All offline single files successfully rebuilt and synchronized!');
}

run();
