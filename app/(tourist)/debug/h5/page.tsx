import { DEV_RUNTIME } from "@/lib/config/public";
import H5ProbeClient from "./h5-probe-client";

/** Server page: prerenders the gate's initial output so the exported HTML
 *  carries the inert notice instead of an empty client shell. All client
 *  behavior (the dev-only dynamic probe import) lives in H5ProbeClient. */
export default function H5ProbePage() {
  return <H5ProbeClient dev={DEV_RUNTIME} />;
}
