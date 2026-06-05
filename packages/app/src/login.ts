import { define } from "@unbndl/html";
import { Auth } from "@unbndl/auth";
import { LoginFormElement } from "./components/login-form.ts";

define({
  "auth-provider": Auth.Provider,
  "login-form": LoginFormElement
});
