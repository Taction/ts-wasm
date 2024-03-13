import {
  register,
  handleCall,
  hostCall,
  handleAbort,
  Result,
  consoleLog,
  consoleLogBuffer,
} from "../assembly";
import { JSON } from "json-as/assembly";

// perform a path that call app a and app b then returns a combined result
register("hello", function (payload: ArrayBuffer): Result<ArrayBuffer> {
  let user = hostCall("user", "get", "", payload);
  if (!user.isOk && user.error() != null) {
    // @ts-ignore
    let err = user.error() as Error;
    return Result.ok<ArrayBuffer>(String.UTF8.encode("err get user"+ err.message));
  }
  consoleLogBuffer(user.get());
  let userstr = String.UTF8.decode(user.get());
    let userJsonR = JSON.parse<UserInfo>(userstr);
    if (!userJsonR.isOk) {
    consoleLog("parse json error:"+(userJsonR.error() as Error).message);
    return Result.error<ArrayBuffer>(new Error("parse json error:"));
    }
    let userJson = userJsonR.get();
  consoleLog("parse user json success:"+ userJson.username);
  let access = hostCall("access", "get", "", payload);
  let accessJsonR = JSON.parse<Access>(String.UTF8.decode(access.get()));
    if (!accessJsonR.isOk) {
    consoleLog("parse json error:"+(accessJsonR.error() as Error).message);
    return Result.error<ArrayBuffer>(new Error("parse json error:"));
    }
    let accessJson = accessJsonR.get();
  let response = new Response();
  response.message = "OK";
  response.data = new ResponseData();
  // @ts-ignore
  response.data.user = userJson;
  response.data.access = accessJson;
  let stringified = JSON.stringify<Response>(response);
  return Result.ok(String.UTF8.encode(stringified));
});

// This must be present in the entry file. Do not remove.

export function __guest_call(operation_size: usize, payload_size: usize): bool {
  return handleCall(operation_size, payload_size);
}

function abort(message: string | null, fileName: string | null, lineNumber: u32, columnNumber: u32): void {
  handleAbort(message, fileName, lineNumber, columnNumber)
}

// define ts object the same as the following go object
// type UserInfo struct {
//   Username string `json:"username,omitempty" protobuf:"bytes,1,opt,name=username"`
//   UID string `json:"uid,omitempty" protobuf:"bytes,2,opt,name=uid"`
//   Groups []string `json:"groups,omitempty" protobuf:"bytes,3,rep,name=groups"`
//   Extra map[string]ExtraValue `json:"extra,omitempty" protobuf:"bytes,4,rep,name=extra"`
// }
// type ExtraValue []string

// 为了让 Map 能够被序列化，需要将其转换为 JSON 对象
// class MapSerializer {
//   private map: Map<string, string[]>;
//
//   constructor(map: Map<string, string[]>) {
//     this.map = map;
//   }
//
//   // 将 Map 转换为 JSON 对象
//   public toJSON(): any {
//     const obj: any = {};
//     for (const [key, value] of this.map) {
//       obj[key] = value;
//     }
//     return obj;
//   }
// }

// 使用 MapSerializer 将 Map 转换为 JSON 对象
// @ts-ignore
@json
class UserInfo {
  username: string;
  uid: string;
  // groups: string[];
  // extra: MapSerializer;

  // constructor(username: string, uid: string, groups: string[], extra: Map<string, string[]>) {
  //   this.username = username;
  //   this.uid = uid;
  //   this.groups = groups;
  //   this.extra = new MapSerializer(extra);
  // }
}
// @ts-ignore
@json
class Access {
  defaultAction: string;
  trustDomain: string;
  policies: AppPolicy[];
}
// @ts-ignore
@json
class AppPolicy {
    appId: string;
    defaultAction: string;
    trustDomain: string;
    namespace: string;
}
// @ts-ignore
@json
class Response {
  message: string;
  data: ResponseData;
}
// @ts-ignore
@json
class ResponseData {
  user: UserInfo;
  access: Access;
}