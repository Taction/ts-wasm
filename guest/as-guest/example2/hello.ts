import {
  register,
  handleCall,
  hostCall,
  handleAbort,
  Result,
  consoleLog,
  consoleLogBuffer,
} from "../assembly";
import { JSON,JSONEncoder } from '../node_modules/assemblyscript-json/assembly';

// 注册路由和处理函数供Host调用。这里注册hello函数，入参固定为buffer array。可以重复调用注册其他函数
register("hello", function (payload: ArrayBuffer): Result<ArrayBuffer> {
  // host call 最后会调用go中的host函数
  let user = hostCall("user", "get", "", payload);
  if (!user.isOk && user.error() != null) {
    // @ts-ignore
    let err = user.error() as Error;
    return Result.ok<ArrayBuffer>(String.UTF8.encode("err get user"+ err.message));
  }
  consoleLogBuffer(user.get());

  let userJson: JSON.Obj = <JSON.Obj>(JSON.parse(String.UTF8.decode(user.get())));
  consoleLog("parse user json success:"+ userJson.get("username")!.toString());
  let access = hostCall("access", "get", "", payload);
  let accessJson: JSON.Obj = <JSON.Obj>(JSON.parse(String.UTF8.decode(access.get())));
  let data = new JSON.Obj();
  data.set("user", userJson);
  data.set("access", accessJson);
  let obj = new JSON.Obj();
  obj.set("message", "OK");
  obj.set("data", data);
  let json = obj.toString()
  return Result.ok(String.UTF8.encode(json));
  // // Create encoder
  // let encoder = new JSONEncoder();
  // encoder.write("{")
  // encoder.setString("message", "OK");
  // encoder.pushObject("data");
  // encoder.setObject("user", String.UTF8.decode(user.get()));
  // encoder.setObject("access", String.UTF8.decode(access.get()));
  // encoder.popObject();
  // encoder.write("}");
  // let json: string = encoder.toString();
  //
  // return Result.ok(String.UTF8.encode(json));
});

// This must be present in the entry file. Do not remove.

export function __guest_call(operation_size: usize, payload_size: usize): bool {
  return handleCall(operation_size, payload_size);
}

function abort(message: string | null, fileName: string | null, lineNumber: u32, columnNumber: u32): void {
  handleAbort(message, fileName, lineNumber, columnNumber)
}
