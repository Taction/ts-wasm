#/bin/bash

asc hello.ts --outFile hello.wasm --optimize

cp hello.wasm ../../../host