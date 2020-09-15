/**
 * A user script is a sequence of HTTP request (REST/GraphQL API requests, page loads, etc.)
 *
 * Each user arriving at the site during the load test will execute the user script.
 */
export type UserScript = () => Promise<any>

export async function userScript() {
  await fetch('https://bespin.cloudcity.computer/')
  await fetch('https://bespin.cloudcity.computer/')
  await fetch('https://bespin.cloudcity.computer/')
}
