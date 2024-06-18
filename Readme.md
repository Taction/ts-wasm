## introduction
`wapc-as` is a demo ts project to wasm file. Using wazero to run wasm file.
The ABI is defined in `wapc` project.

## usage
```sh
cd host
go run main.go
```

Use the following command to trigger the wasm execution.
```shell
curl localhost:8088
```

## build example
```sh
cd guest/as-guest/example2
./build.sh
```
will build the wasm file and copy to `host` folder.

## todo list
- guest sdk 需要提供版本函数，每个版本写死返回，用于breaking change。
