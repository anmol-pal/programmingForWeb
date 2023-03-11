#!/usr/bin/env node

import main from './src/main.mjs'

main(process.argv.slice(2)).catch(err => console.error(err));
