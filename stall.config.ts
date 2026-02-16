import chokidar from "chokidar";
import { getDefaultBuildOptions, rebuild } from "./stall.build";

const PORT = 5155;

const build_options = getDefaultBuildOptions();
const is_production = process.argv.includes("--production");

await rebuild(build_options);

if (!is_production) {
  chokidar
    .watch("src", { ignoreInitial: true })
    .on("all", () => rebuild(build_options));

  console.log(
    `Serving: http://localhost:${PORT}/${build_options.dist}/${build_options.output.split("/").pop()}`,
  );

  Bun.serve({
    port: PORT,
    fetch(req) {
      const filename = build_options.output.split("/").pop() as string;
      const pathname = `/${build_options.dist}/${filename}`;

      if (new URL(req.url).pathname === pathname) {
        return new Response(Bun.file(build_options.output), {
          headers: {
            "Content-Type": "application/javascript",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      return new Response("Not Found", { status: 404 });
    },
  });
} else {
  console.log("[✓] Build complete!");
  process.exit(0);
}
