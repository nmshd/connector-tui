set -e
set -x

npm ci
npm run lint:prettier
npm run lint:eslint
npx license-check --ignoreRegex "@nmshd/*"
npx better-npm-audit audit --exclude 1113371
npm run build
