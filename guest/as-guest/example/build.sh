#/bin/bash

npm i

JSON_DEBUG=true asc hello.ts --debug --target debug --outFile hello.wasm --transform json-as/transform #--optimize # --transform json-as/transform

cp hello.wasm ../../../host