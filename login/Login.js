"use strict";
/**
@namespace Login
*/

let Login = {};
let APP = ATON.App.realize();
window.Login = Login;
let basepath = "heriverse";
APP.setup = () => {
	ATON.FE.realize();
	ATON.on("AllFlaresReady", () => {
		console.log("All flares ready");
	});
};

Login.init = () => {
	ATON.AuthOptions = {
		formTitle: "ACCEDI A HERIVERSE",
		username: "Nome utente",
		password: "Password",
		rememberMe: "Ricordami",
		forgotPassword: "Password dimenticata?",
		signIn: "Entra",
		cancel: "ANNULLA",
		signUpMessage: "Non hai ancora un account DIGILAB?",
		signUp: "Registrati ora",
		basepath: basepath,
	};
	APP.requireFlares(["Auth"]);
	APP.run();
};
