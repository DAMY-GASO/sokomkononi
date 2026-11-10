

export async function callApiOrFallback(apiCall) {
  try {
    const res = await apiCall();
    return { ...res, offline: false };
  } catch (err) {
    const status = err?.status;
    if (status === 404 || status === 501) {
      console.error(
        "[DealRooms] Backend endpoint haipo (404/501). Hakuna local fallback.",
        err
      );
      return { ok: false, error: err, offline: true };
    }
    return { ok: false, error: err, offline: false };
  }
}
