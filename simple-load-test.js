const BASE_URL = "http://localhost:3000";
const USERS = 50;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const randomDelay = () =>
  sleep(500 + Math.floor(Math.random() * 1000));

async function request(user, route) {
  const start = Date.now();

  try {
    const res = await fetch(`${BASE_URL}${route}`);

    // Download complete response
    await res.text();

    return {
      user,
      route,
      status: res.status,
      time: Date.now() - start,
    };
  } catch (error) {
    return {
      user,
      route,
      status: "ERROR",
      time: Date.now() - start,
      error: error.message,
    };
  }
}

async function simulateUser(user) {
  const results = [];

  // 1. Open homepage
  results.push(await request(user, "/"));
  await randomDelay();

  // 2. Open shopping
  results.push(
    await request(
      user,
      "/shopping?category=guess-you-like"
    )
  );
  await randomDelay();

  // 3. Get products
  results.push(
    await request(
      user,
      "/api/items?type=product&limit=12"
    )
  );
  await randomDelay();

  // 4. Browse shops
  results.push(await request(user, "/shops"));

  return results;
}

async function run() {
  console.log(`Simulating ${USERS} students...\n`);

  const testStart = Date.now();

  const userTests = Array.from(
    { length: USERS },
    (_, i) => simulateUser(i + 1)
  );

  const nestedResults = await Promise.all(userTests);
  const results = nestedResults.flat();

  console.table(results);

  const successful = results.filter(
    (r) =>
      typeof r.status === "number" &&
      r.status >= 200 &&
      r.status < 400
  );

  const failed = results.filter(
    (r) =>
      !(
        typeof r.status === "number" &&
        r.status >= 200 &&
        r.status < 400
      )
  );

  const times = successful.map((r) => r.time);

  const average =
    times.length > 0
      ? Math.round(
          times.reduce((a, b) => a + b, 0) /
            times.length
        )
      : 0;

  console.log("\n========== REALISTIC LOAD TEST ==========");
  console.log(`Students:       ${USERS}`);
  console.log(`Total requests: ${results.length}`);
  console.log(`Successful:     ${successful.length}`);
  console.log(`Failed:         ${failed.length}`);

  if (times.length) {
    console.log(`Fastest:        ${Math.min(...times)} ms`);
    console.log(`Average:        ${average} ms`);
    console.log(`Slowest:        ${Math.max(...times)} ms`);
  }

  console.log(
    `Total test:     ${Date.now() - testStart} ms`
  );

  console.log("==========================================");

  // Summary per route
  console.log("\n========== ROUTE SUMMARY ==========");

  const routes = [...new Set(results.map((r) => r.route))];

  for (const route of routes) {
    const routeResults = results.filter(
      (r) => r.route === route
    );

    const routeSuccess = routeResults.filter(
      (r) =>
        typeof r.status === "number" &&
        r.status >= 200 &&
        r.status < 400
    );

    const routeTimes = routeSuccess.map((r) => r.time);

    const avg =
      routeTimes.length > 0
        ? Math.round(
            routeTimes.reduce((a, b) => a + b, 0) /
              routeTimes.length
          )
        : 0;

    console.log(`\n${route}`);
    console.log(`  Requests: ${routeResults.length}`);
    console.log(`  Success:  ${routeSuccess.length}`);
    console.log(
      `  Failed:   ${
        routeResults.length - routeSuccess.length
      }`
    );
    console.log(`  Average:  ${avg} ms`);
  }
}

run();