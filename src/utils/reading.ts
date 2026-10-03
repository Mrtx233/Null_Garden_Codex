export function readingMinutes(body = "") {
  const chinese = body.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const words = body.match(/[a-zA-Z]+/g)?.length ?? 0;
  return Math.max(1, Math.ceil(chinese / 400 + words / 200));
}
export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
