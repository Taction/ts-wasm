package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/wapc/wapc-go"
	"github.com/wapc/wapc-go/engines/wazero"
)

func main() {
	ctx := context.Background()
	guest, err := os.ReadFile("hello.wasm")
	if err != nil {
		panic(err)
	}

	engine := wazero.Engine()

	module, err := engine.New(ctx, host, guest, &wapc.ModuleConfig{
		Logger: wapc.PrintlnLogger,
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

	result, err := instance.Invoke(ctx, "hello", []byte("world")) // request path and request data
	if err != nil {
		panic(err)
	}

	fmt.Println(string(result))
	var response Response
	err = json.Unmarshal(result, &response)
	if err != nil {
		panic(err)
	}
	fmt.Println(response)
}

func host(ctx context.Context, service, method, metadata string, payload []byte) ([]byte, error) {
	// 假装向对应的服务发送请求，并将结果返回给wasm
	switch service {
	case "user":
		user := UserInfo{
			Username: "daomoyan",
			UID:      "charon.zhang",
			Groups:   []string{"admin", "dev"},
			Extra:    map[string]ExtraValue{"a": {"b", "c"}},
		}
		response, _ := json.Marshal(user)
		return response, nil
	case "access":
		access := AccessControlSpec{
			DefaultAction: "allow",
			TrustDomain:   "example.com",
			AppPolicies: []AppPolicySpec{
				{
					AppName:       "app1",
					DefaultAction: "allow",
					TrustDomain:   "example.com",
					Namespace:     "default",
				},
			},
		}
		response, _ := json.Marshal(access)
		return response, nil
	}
	return []byte("unsupported"), nil
}

// UserInfo holds the information about the user needed to implement the
// user.Info interface.
type UserInfo struct {
	Username string                `json:"username,omitempty" protobuf:"bytes,1,opt,name=username"`
	UID      string                `json:"uid,omitempty" protobuf:"bytes,2,opt,name=uid"`
	Groups   []string              `json:"groups,omitempty" protobuf:"bytes,3,rep,name=groups"`
	Extra    map[string]ExtraValue `json:"extra,omitempty" protobuf:"bytes,4,rep,name=extra"`
}
type ExtraValue []string

type AccessControlSpec struct {
	DefaultAction string          `json:"defaultAction" yaml:"defaultAction"`
	TrustDomain   string          `json:"trustDomain" yaml:"trustDomain"`
	AppPolicies   []AppPolicySpec `json:"policies" yaml:"policies"`
}

// AppPolicySpec defines the policy data structure for each app.
type AppPolicySpec struct {
	AppName       string `json:"appId" yaml:"appId"`
	DefaultAction string `json:"defaultAction" yaml:"defaultAction"`
	TrustDomain   string `json:"trustDomain" yaml:"trustDomain"`
	Namespace     string `json:"namespace" yaml:"namespace"`
}

type Response struct {
	Message string `json:"message"`
	Data    struct {
		User   UserInfo          `json:"user"`
		Access AccessControlSpec `json:"access"`
	} `json:"data"`
}
