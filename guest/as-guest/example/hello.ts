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
  let userJson = JSON.parse<UserInfo>(userstr);
  consoleLog("parse user json success:"+ userJson.username);
  let access = hostCall("access", "get", "", payload);
  let accessJson = JSON.parse<Access>(String.UTF8.decode(access.get()));

  let state = JSON.parse<NonFungibleToken>('{"owner":"","m":{"a":"b"},"counter":0,"tokens":{},"owners":{1:"a"},"balances":{"a":9}}');
  consoleLog("parse map success:");
  consoleLog(""+ state.m.get("a"));

  let response = new Response();
  response.data = new ResponseData();
  response.message = "OK——start";
  // @ts-ignore
  response.data.user = userJson;
  response.data.access = accessJson;
  let stringified = JSON.stringify<Response>(response);
  return Result.ok(String.UTF8.encode(stringified));
});

export function _start(): void {

}

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
// @ts-ignore
@json
class UserInfo {
  username: string;
  uid: string;
  groups: string[];

  constructor(username: string, uid: string, groups: string[]) {
    this.username = username;
    this.uid = uid;
    this.groups = groups;
  }
}

// @ts-ignore
@json
class Access {
  defaultAction: string;
  trustDomain: string;
  policies: AppPolicy[];

  constructor(defaultAction: string = "", trustDomain: string = "", policies: AppPolicy[] = []) {
    this.defaultAction = defaultAction;
    this.trustDomain = trustDomain;
    this.policies = policies;
  }
}

// @ts-ignore
@json
class AppPolicy {
  appId: string;
  defaultAction: string;
  trustDomain: string;
  namespace: string;

  constructor(appId: string = "", defaultAction: string = "", trustDomain: string = "", namespace: string = "") {
    this.appId = appId;
    this.defaultAction = defaultAction;
    this.trustDomain = trustDomain;
    this.namespace = namespace;
  }
}

// @ts-ignore
@json
class Response {
  message: string;
  data: ResponseData;

  constructor(message: string = "", data: ResponseData = new ResponseData()) {
    this.message = message;
    this.data = data;
  }
}

// @ts-ignore
@json
class ResponseData {
  user: UserInfo;
  access: Access;

  constructor(user: UserInfo = new UserInfo("", "", []), access: Access = new Access()) {
    this.user = user;
    this.access = access;
  }
}
@json
class TokenMetaData {
  id: u64;
  name: string;
  uri: string;

  constructor(id: u64, name: string, uri: string) {
    this.id = id;
    this.name = name;
    this.uri = uri;
  }
}
@json
class NonFungibleToken {
  owner: string;
  counter: u64;
  m : Map<string,string>;
  tokens: Map<u64, TokenMetaData>;
  owners: Map<u64, string>;
  balances: Map<string, u64[]>;

  constructor() {
    this.owner = "";
    this.counter = 0;
    this.m = new Map<string, string>();
    this.tokens = new Map<u64, TokenMetaData>();
    this.owners = new Map<u64, string>();
    this.balances = new Map<string, u64[]>();
  }

  mint(name: string, uri: string, toAddress: string): u64 {
    this.counter += 1;
    let id = this.counter;

    const tokenMetaData = new TokenMetaData(id, name, uri);

    // beyond this point program fails with `out of memory bound access` error!
    this.tokens.set(id, tokenMetaData);
    this.owners.set(id, toAddress);

    if (!this.balances.has(toAddress)) {
      this.balances.set(toAddress, []);
    }

    this.balances.get(toAddress).push(id);

    return id;
  }
}
