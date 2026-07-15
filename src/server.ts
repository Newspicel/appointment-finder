import handler from "@tanstack/react-start/server-entry"

export { SessionDurableObject } from "./session-do"

export default {
	fetch: handler.fetch,
}
