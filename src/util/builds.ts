type BuildInfo = {
  url: string;
  format: "zip" | "rar";
};

const BuildsList = new Map<string, BuildInfo>([
  ["1.7.2", { url: "https://builds.rebootfn.org/1.7.2.zip", format: "zip" }],
  ["1.10", { url: "https://builds.rebootfn.org/1.10.rar", format: "rar" }],
  ["8.51", { url: "https://builds.rebootfn.org/8.51.rar", format: "rar" }],
  ["9.41", { url: "https://builds.rebootfn.org/9.41.rar", format: "rar" }],
  ["10.40", { url: "https://cdn.cbn.lol/10.40", format: "rar" }],
]);

export function getBuild(version: string): BuildInfo | null {
  return BuildsList.get(version) ?? null;
}
