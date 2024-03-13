#/bin/bash

asc hello.ts --outFile hello.wasm --optimize --transform json-as/transform

cp hello.wasm ../../../host