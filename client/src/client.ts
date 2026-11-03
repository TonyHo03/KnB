import {Api} from "./api/Api.ts"

export const api = new Api({
    baseUrl: "http://localhost:5056",
    baseApiParams: { credentials: "include" },
});