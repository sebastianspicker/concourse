export function createDockerSummary() {
  return { scope: "docker", status: "ready" };
}

// current lane: docker
export function dockerTask() {
  return { scope: "docker", status: "ready" };
}
