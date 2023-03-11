import bcrypt from 'bcrypt';

async function go() {
  const PW = 'asdf';
  const h1 = await bcrypt.hash(PW, 10);
  const h2 = await bcrypt.hash(PW, 10);
  console.log(`hash1: ${h1}`);
  console.log(`hash2: ${h2}`);
  console.log('cmp1', await bcrypt.compare(PW, h1));
  console.log('cmp2', await bcrypt.compare(PW + 'a', h1));
}

go().catch(err => console.error(err));

