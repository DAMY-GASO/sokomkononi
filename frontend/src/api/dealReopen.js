// ============================================================
// src/api/dealReopen.js
// Fufua Deal Room iliyoghairiwa/kufungwa — mazungumzo ya awali yanabaki.
//
// ⚠️ Inadhania endpoint:  POST /deals/<id>/reopen/
// Kama dealsApi yako ina `reopen`, itatumika yenyewe. Vinginevyo rekebisha
// njia hapa chini ilingane na backend (au iweke ndani ya api/deals.js).
// ============================================================
import { api } from "./client.js";
import { dealsApi } from "./deals.js";

export async function reopenDealRoom(dealRoomId, { note = "" } = {}) {
  if (!dealRoomId) throw new Error("dealRoomId required");
  if (typeof dealsApi?.reopen === "function") {
    return dealsApi.reopen(dealRoomId, { note });
  }
  return api.post(`/deals/${dealRoomId}/reopen/`, { note });
}