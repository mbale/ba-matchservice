import 'reflect-metadata';
import initContainer from './container';

async function main() {
  const container = await initContainer();
}

main();
