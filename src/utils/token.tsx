import { jwtDecode } from "jwt-decode";

function saveToken(access_token: string) {
  localStorage.setItem("access_token", access_token);
}

function getToken() {
  let token: string | null = localStorage.getItem("access_token") ?? null;
  try {
    if (typeof token === "string") {
      return jwtDecode(token);
    }
  } catch (error) {
    console.log(error);
  }

  return null;
}

function destroyToken() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("rememberMe");
  window.location.pathname = "/";
}

export { saveToken, getToken, destroyToken };
