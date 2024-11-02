build: get_deps
	mkdir -p dist
	cp src/index.html dist/index.html
	cp src/index.js dist/index.js
	cp node_modules/@dimforge/rapier2d-compat/rapier.es.js dist/rapier.es.js

run: build
	npx http-server dist/

format: get_deps
	npx prettier . --write

check: get_deps
	npx prettier . --check

get_deps:
	npm ci --include=dev --fund=false

clean:
	rm -rf dist node_modules
