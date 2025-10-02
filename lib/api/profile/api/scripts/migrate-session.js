import fs from 'fs/promises';
import path from 'path';
import { createStorageAdapter } from '../lib/storage-adapter.js';

async function migrate() {
  console.log('Iniciando migração da sessão local para o armazenamento remoto...');
  const localDir = path.resolve(process.cwd(), 'session');
  const remoteStorage = createStorageAdapter();
  try {
    const files = await fs.readdir(localDir);
    if (files.length === 0) {
      console.log('Nenhum arquivo de sessão encontrado. Nada para migrar.');
      return;
    }
    for (const file of files) {
      const data = await fs.readFile(path.join(localDir, file), 'utf-8');
      await remoteStorage.writeData(file, JSON.parse(data));
      console.log(`${file} migrado com sucesso!`);
    }
    console.log('\nMigração concluída!');
  } catch (error) {
    console.error('Ocorreu um erro durante a migração:', error);
  }
}
migrate();
