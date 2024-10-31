build: get_dependencies
	mkdir -p dist
	cp src/index.html dist/index.html
	cp src/index.js dist/index.js
	cp node_modules/@dimforge/rapier2d-compat/rapier.es.js dist/rapier.es.js

run: build
	npx http-server dist/

get_dependencies:
	npm install --include=dev --fund=false

format: get_dependencies
	npx prettier . --write

clean:
	rm -rf dist node_modules
