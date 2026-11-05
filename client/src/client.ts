import {Api} from "./api/Api.ts"

export const api = new Api({
    baseUrl: location.port === "3000" ? "http://localhost:5056" : `http://${location.hostname}:8080`,
    baseApiParams: { credentials: "include" },
});