install:
	npm install

start:
	npx babel-node -- src/bin/pageLoader.js

lint:
	npx eslint .

test:
	npx jest

test-coverage:
	npx jest --coverage

watch:
	npx jest --watch

publish:
	npm publish