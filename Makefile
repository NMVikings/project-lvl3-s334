install:
	npm install

start:
	npx babel-node -- src/bin/pageLoader.js https://nmvikings.github.io

lint:
	npx eslint .

test:
	DEBUG=page-loader npx jest

test-coverage:
	npx jest --coverage

watch:
	DEBUG=page-loader npx jest --watch --verbose false

link:
	npm uninstall -g page-loader && npm run build && npm link

publish:
	npm publish