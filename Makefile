.POSIX:

all: build

run: build
	npx http-server

build:
	mkdir -p dist
	cp src/index.html dist/index.html
	cp src/index.js dist/index.js
	cp node_modules/@dimforge/rapier2d-compat/rapier.es.js dist/rapier.es.js

format:
	npx prettier . --write
