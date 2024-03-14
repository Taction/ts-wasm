package main

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	"github.com/wapc/wapc-go"
	"github.com/wapc/wapc-go/engines/wazero"
)

func BenchmarkWasm(b *testing.B) {
	ctx := context.Background()
	guest, err := os.ReadFile("hello.wasm")
	if err != nil {
		panic(err)
	}

	engine := wazero.Engine()

	module, err := engine.New(ctx, host, guest, &wapc.ModuleConfig{
		Logger: func(msg string) {},
		Stdout: os.Stdout,
		Stderr: os.Stderr,
	})
	if err != nil {
		panic(err)
	}
	defer module.Close(ctx)

	instance, err := module.Instantiate(ctx)
	if err != nil {
		panic(err)
	}
	defer instance.Close(ctx)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := instance.Invoke(ctx, "hello", []byte("world"))
		if err != nil {
			panic(err)
		}
	}
}

func BenchmarkNative(b *testing.B) {
	for i := 0; i < b.N; i++ {
		user, _ := host(context.Background(), "user", "get", "", []byte("world"))
		access, _ := host(context.Background(), "access", "get", "", []byte("world"))
		u := UserInfo{}
		json.Unmarshal(user, &u)
		a := AccessControlSpec{}
		json.Unmarshal(access, &a)
		res := Response{
			Message: "OK",
		}
		res.Data.User = u
		res.Data.Access = a
		_, _ = json.Marshal(res)
	}
}

func BenchmarkEmpty(b *testing.B) {
	for i := 0; i < b.N; i++ {
		var f = func() {}
		f()
	}
}
