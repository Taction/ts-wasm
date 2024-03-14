package main

import (
	"fmt"
	"net/http"
	_ "net/http/pprof"
	"os"
	"os/signal"
	"runtime"
)

func runserver(handler func(w http.ResponseWriter, r *http.Request)) {
	http.HandleFunc("/", handler)
	http.HandleFunc("/mem", func(w http.ResponseWriter, _ *http.Request) {
		m := runtime.MemStats{}
		runtime.ReadMemStats(&m)
		fmt.Printf("%+v", m)
	})
	addr := ":8088"
	server := &http.Server{Addr: addr}
	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, os.Interrupt, os.Kill)
		<-c
		server.Close()
		os.Exit(0)
	}()
	fmt.Println("Listening on ", addr)
	err := server.ListenAndServe()
	fmt.Println("Exiting ...", err)
}
